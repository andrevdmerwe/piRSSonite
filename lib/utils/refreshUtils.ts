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

const MAX_ENTRIES_PER_FEED = 200
const MAX_CONTENT_LENGTH = 50000

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
 * First valid date of the candidates, else now. One unparseable pubDate
 * would otherwise make Prisma reject the item and fail the whole feed.
 */
function parseItemDate(...candidates: (string | undefined)[]): Date {
  for (const value of candidates) {
    if (!value) continue
    const date = new Date(value)
    if (!isNaN(date.getTime())) return date
    // A bad zone token, e.g. 3dprintingprogress.com's "Wed, 11 Nov 2026 ZZZ"
    const withoutZone = new Date(value.replace(/\s+[A-Za-z]+$/, ''))
    if (!isNaN(withoutZone.getTime())) return withoutZone
  }
  return new Date()
}

/**
 * Parse RSS/Atom XML into a title and sanitised entries.
 * Items without a link or a title are dropped.
 */
async function parseFeedXml(xmlText: string): Promise<{ title?: string; entries: ParsedEntry[] }> {
  const feed = await parser.parseString(xmlText)

  const entries: ParsedEntry[] = feed.items
    .map(item => {
      if (!item.link || !item.title) return null

      const rawContent = item.content || item.contentSnippet || item.summary || ''
      const content = sanitizeHtml(rawContent, {
        allowedTags: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img'],
        allowedAttributes: {
          a: ['href', 'title', 'target'],
          img: ['src', 'alt', 'title', 'width', 'height'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
      })

      const truncatedContent = content.length > MAX_CONTENT_LENGTH
        ? content.substring(0, MAX_CONTENT_LENGTH) + '... [content truncated]'
        : content

      return {
        url: item.link,
        title: item.title,
        content: truncatedContent,
        published: parseItemDate(item.pubDate, item.isoDate),
      }
    })
    .filter((entry): entry is ParsedEntry => entry !== null)
    .slice(0, MAX_ENTRIES_PER_FEED)

  return { title: feed.title, entries }
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
    const { title, entries } = await parseFeedXml(xmlText)

    // Extract WebSub hub and topic using proper RFC 5988 discovery
    const { hubUrl, topicUrl } = await discoverWebSubEndpoints(url, xmlText, response.headers)

    return {
      title: title || url,
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
  if (entries.length > MAX_ENTRIES_PER_FEED) {
    const idsToKeep = entries.slice(0, MAX_ENTRIES_PER_FEED).map((e: { id: number }) => e.id)
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
 * Insert entries whose URL is new for this feed, then trim the feed to the
 * newest 200. Call inside a transaction.
 * @returns Number of entries inserted
 */
export async function storeNewEntries(feedId: number, entries: ParsedEntry[], tx: any): Promise<number> {
  if (entries.length === 0) return 0

  // Manually skip duplicates (SQLite has no createMany skipDuplicates)
  const existingEntries = await tx.entry.findMany({
    where: { feedId },
    select: { url: true },
  })
  // Also drops repeats within the payload: some feeds list the same link
  // twice, and inserting both breaks the (feedId, url) unique constraint
  const seenUrls = new Set<string>(existingEntries.map((e: { url: string }) => e.url))
  const newEntries = entries.filter(entry => {
    if (seenUrls.has(entry.url)) return false
    seenUrls.add(entry.url)
    return true
  })

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

  await truncateOldEntries(feedId, tx)
  return newEntries.length
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

  const { entries } = await parseFeedXml(xmlText)

  await prismaToUse.$transaction(async (tx: any) => {
    await storeNewEntries(feedId, entries, tx)
  })
}
