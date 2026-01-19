import Parser from 'rss-parser'
import sanitizeHtml from 'sanitize-html'
import { ParsedFeed, ParsedEntry } from '../types'
import { discoverWebSubEndpoints } from './websubUtils'

const parser = new Parser({
  timeout: 30000, // 30 second timeout
  customFields: {
    item: [],
  },
})

/**
 * Calculate the next check time based on failure count using exponential backoff
 * @param failureCount - Number of consecutive failures
 * @param baseInterval - Base interval in milliseconds (default: 15 minutes)
 * @returns Next check time as Date
 */
export function calculateNextCheckTime(
  failureCount: number,
  baseInterval: number = 15 * 60 * 1000
): Date {
  const backoffMultiplier = Math.pow(2, Math.min(failureCount, 8))
  const delayMs = baseInterval * backoffMultiplier
  return new Date(Date.now() + delayMs)
}

/**
 * Fetch and parse an RSS/Atom feed
 * @param url - Feed URL
 * @returns Parsed feed data
 */
export async function fetchAndParseFeed(url: string): Promise<ParsedFeed> {
  try {
    // Fetch the feed with browser-like headers (Reddit and others block non-browser User-Agents)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xmlText = await response.text()
    const feed = await parser.parseString(xmlText)

    // Extract WebSub hub and topic using proper RFC 5988 discovery
    const { hubUrl, topicUrl } = await discoverWebSubEndpoints(url, xmlText, response.headers)

    const entries: ParsedEntry[] = feed.items
      .map(item => {
        if (!item.link || !item.title) return null

        // Sanitize HTML content
        const rawContent = item.content || item.contentSnippet || item.summary || ''
        const content = sanitizeHtml(rawContent, {
          allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img'],
          allowedAttributes: {
            a: ['href', 'title', 'target'],
            img: ['src', 'alt', 'title', 'width', 'height'],
          },
          allowedSchemes: ['http', 'https', 'mailto'],
        })

        // Truncate very large content (max 50KB)
        const truncatedContent = content.length > 50000
          ? content.substring(0, 50000) + '... [content truncated]'
          : content

        return {
          url: item.link,
          title: item.title,
          content: truncatedContent,
          published: item.pubDate ? new Date(item.pubDate) : new Date(),
        }
      })
      .filter((entry): entry is ParsedEntry => entry !== null)
      .slice(0, 200) // Keep only 200 most recent entries

    return {
      title: feed.title || url,
      entries,
      hubUrl,
      topicUrl,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch feed: ${error.message}`)
    }
    throw new Error('Failed to fetch feed: Unknown error')
  }
}

/**
 * Truncate old entries from a feed to keep only the most recent 200
 * @param feedId - Feed ID
 * @param prisma - Prisma client
 */
export async function truncateOldEntries(feedId: number, prisma: any): Promise<void> {
  // Get all entry IDs for this feed, sorted by published date (newest first)
  const entries = await prisma.entry.findMany({
    where: { feedId },
    select: { id: true },
    orderBy: { published: 'desc' },
  })

  // If more than 200 entries, delete the oldest ones
  if (entries.length > 200) {
    const idsToKeep = entries.slice(0, 200).map((e: { id: number }) => e.id)
    await prisma.entry.deleteMany({
      where: {
        feedId,
        id: {
          notIn: idsToKeep,
        },
      },
    })
  }
}

/**
 * Parse XML feed content and store new entries
 * Used by WebSub callback to process pushed content
 * @param feedId - Feed ID
 * @param xmlText - Raw XML feed content
 * @param prisma - Prisma client (optional, uses global if not provided)
 */
export async function parseAndStoreFeed(
  feedId: number,
  xmlText: string,
  prismaClient?: any
): Promise<void> {
  const prismaToUse = prismaClient || (await import('@/lib/prisma')).prisma

  const feed = await parser.parseString(xmlText)

  const entries: ParsedEntry[] = feed.items
    .map(item => {
      if (!item.link || !item.title) return null

      // Sanitize HTML content
      const rawContent = item.content || item.contentSnippet || item.summary || ''
      const content = sanitizeHtml(rawContent, {
        allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img'],
        allowedAttributes: {
          a: ['href', 'title', 'target'],
          img: ['src', 'alt', 'title', 'width', 'height'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
      })

      // Truncate very large content (max 50KB)
      const truncatedContent = content.length > 50000
        ? content.substring(0, 50000) + '... [content truncated]'
        : content

      return {
        url: item.link,
        title: item.title,
        content: truncatedContent,
        published: item.pubDate ? new Date(item.pubDate) : new Date(),
      }
    })
    .filter((entry): entry is ParsedEntry => entry !== null)
    .slice(0, 200)

  // Add new entries in a transaction
  await prismaToUse.$transaction(async (tx: any) => {
    if (entries.length > 0) {
      // Get existing entry URLs for this feed
      const existingEntries = await tx.entry.findMany({
        where: { feedId },
        select: { url: true },
      })
      const existingUrls = new Set(existingEntries.map((e: any) => e.url))

      // Filter out entries that already exist
      const newEntries = entries.filter(entry => !existingUrls.has(entry.url))

      // Insert only new entries
      if (newEntries.length > 0) {
        for (const entry of newEntries) {
          await tx.entry.create({
            data: {
              url: entry.url,
              title: entry.title,
              content: entry.content,
              published: entry.published,
              feedId,
            },
          })
        }
      }

      // Truncate old entries to keep only 200 most recent
      await truncateOldEntries(feedId, tx)
    }
  })
}
