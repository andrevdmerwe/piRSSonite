/**
 * OPML (Outline Processor Markup Language) utilities for import/export
 * Supports OPML 1.0 and 2.0 formats
 */

import { Feed, Folder } from '@prisma/client'

/**
 * Escape special XML characters to entities
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Format date in RFC 2822 format for OPML header
 * Example: "Tue, 18 Jan 2026 12:00:00 GMT"
 */
export function formatDateRFC2822(date: Date): string {
  return date.toUTCString()
}

/**
 * Generate OPML 2.0 XML from folders and feeds
 */
export function generateOpml(
  folders: (Folder & { feeds: Feed[] })[],
  rootFeeds: Feed[]
): string {
  const dateCreated = formatDateRFC2822(new Date())

  // Build folder outlines with nested feed outlines
  const folderOutlines = folders
    .map((folder) => {
      const feedOutlines = folder.feeds
        .map(
          (feed) =>
            `    <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}"/>`
        )
        .join('\n')

      return `  <outline text="${escapeXml(folder.name)}" title="${escapeXml(folder.name)}">
${feedOutlines}
  </outline>`
    })
    .join('\n')

  // Build root feed outlines (feeds without folders)
  const rootOutlines = rootFeeds
    .map(
      (feed) =>
        `  <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}"/>`
    )
    .join('\n')

  // Combine all parts into OPML XML
  const bodyContent = [folderOutlines, rootOutlines].filter(Boolean).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>piRSSonite Feeds</title>
    <dateCreated>${dateCreated}</dateCreated>
  </head>
  <body>
${bodyContent}
  </body>
</opml>`
}

/**
 * Parsed OPML structure
 */
export interface ParsedOpml {
  folders: Array<{
    name: string
    feeds: Array<{ title: string; url: string }>
  }>
  rootFeeds: Array<{ title: string; url: string }>
}

/**
 * Extract attribute value from XML string
 */
function extractAttribute(str: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}=["']([^"']*?)["']`, 'i')
  const match = str.match(regex)
  return match ? match[1] : null
}

/**
 * Parse OPML XML string into structured data
 * Supports OPML 1.0 and 2.0 formats
 */
export function parseOpml(xmlText: string): ParsedOpml {
  // Validate OPML structure
  const opmlMatch = xmlText.match(/<opml\s+version=["']([12]\.\d)["']/)
  if (!opmlMatch) {
    throw new Error('Missing <opml> root element or invalid version')
  }

  // Extract body content
  const bodyMatch = xmlText.match(/<body>([\s\S]*?)<\/body>/)
  if (!bodyMatch) {
    throw new Error('Missing <body> element')
  }

  const bodyContent = bodyMatch[1]

  // Extract all top-level outlines (regex captures self-closing and paired tags)
  const outlineRegex = /<outline\s+([^>]*?)(?:\s*\/>|>([\s\S]*?)<\/outline>)/g
  const folders: Array<{ name: string; feeds: Array<{ title: string; url: string }> }> = []
  const rootFeeds: Array<{ title: string; url: string }> = []

  let match
  while ((match = outlineRegex.exec(bodyContent)) !== null) {
    const attributes = match[1]
    const children = match[2] || ''

    const xmlUrl = extractAttribute(attributes, 'xmlUrl')

    if (xmlUrl) {
      // It's a feed (has xmlUrl)
      const title =
        extractAttribute(attributes, 'text') ||
        extractAttribute(attributes, 'title') ||
        xmlUrl.split('/')[2] || // domain name fallback
        'Untitled Feed'

      rootFeeds.push({ title, url: xmlUrl })
    } else if (children.trim()) {
      // It's a folder (no xmlUrl, has children)
      const folderName =
        extractAttribute(attributes, 'text') ||
        extractAttribute(attributes, 'title') ||
        'Unnamed Folder'

      // Extract child feeds
      const childFeeds: Array<{ title: string; url: string }> = []
      const childRegex = /<outline\s+([^>]*?)\s*\/?>/g
      let childMatch

      while ((childMatch = childRegex.exec(children)) !== null) {
        const childAttrs = childMatch[1]
        const childXmlUrl = extractAttribute(childAttrs, 'xmlUrl')

        if (childXmlUrl) {
          const childTitle =
            extractAttribute(childAttrs, 'text') ||
            extractAttribute(childAttrs, 'title') ||
            childXmlUrl.split('/')[2] ||
            'Untitled Feed'

          childFeeds.push({ title: childTitle, url: childXmlUrl })
        }
      }

      if (childFeeds.length > 0) {
        folders.push({ name: folderName, feeds: childFeeds })
      }
    }
  }

  return { folders, rootFeeds }
}
