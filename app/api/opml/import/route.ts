import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseOpml } from '@/lib/utils/opmlUtils'
import { fetchAndParseFeed } from '@/lib/utils/refreshUtils'

/**
 * POST handler to import feeds from uploaded OPML file
 * Returns summary of imported/skipped/failed feeds
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['text/xml', 'application/xml']
    const validExts = ['.opml', '.xml']
    const hasValidType = validTypes.includes(file.type)
    const hasValidExt = validExts.some((ext) => file.name.endsWith(ext))

    if (!hasValidType && !hasValidExt) {
      return NextResponse.json(
        { error: 'Invalid file type (expected XML/OPML)' },
        { status: 400 }
      )
    }

    // Read and parse OPML
    const xmlText = await file.text()
    let parsed
    try {
      parsed = parseOpml(xmlText)
    } catch (error: any) {
      return NextResponse.json(
        { error: `Invalid OPML format: ${error.message}` },
        { status: 422 }
      )
    }

    // Step 1: Validate and fetch all feeds BEFORE transaction
    // Combine all feeds (from folders + root)
    const allFeeds = [
      ...parsed.folders.flatMap((f) =>
        f.feeds.map((feed) => ({ ...feed, folderName: f.name }))
      ),
      ...parsed.rootFeeds.map((feed) => ({ ...feed, folderName: null as string | null })),
    ]

    // Validate feeds and fetch metadata outside transaction
    const validatedFeeds: Array<{
      url: string
      title: string
      folderName: string | null
      hubUrl: string | null
      topicUrl: string | null
    }> = []
    const errors: string[] = []

    for (const feedData of allFeeds) {
      // Validate URL format
      try {
        const url = new URL(feedData.url)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol')
        }
      } catch (err) {
        errors.push(`Invalid URL format: ${feedData.url}`)
        continue
      }

      // Fetch and validate feed
      try {
        const parsedFeed = await fetchAndParseFeed(feedData.url)
        validatedFeeds.push({
          url: feedData.url,
          title: parsedFeed.title,
          folderName: feedData.folderName,
          hubUrl: parsedFeed.hubUrl ?? null,
          topicUrl: parsedFeed.topicUrl ?? null,
        })
      } catch (error: any) {
        errors.push(`Failed to fetch ${feedData.url}: ${error.message}`)
      }
    }

    // Step 2: Import validated feeds in transaction
    const result = await prisma.$transaction(async (tx) => {
      let imported = 0
      let skipped = 0

      // Create/find folders
      const folderMap = new Map<string, number>()

      for (const folder of parsed.folders) {
        // Check if folder exists
        const existing = await tx.folder.findUnique({
          where: { name: folder.name },
        })

        if (existing) {
          folderMap.set(folder.name, existing.id)
        } else {
          // Create new folder with max order + 1
          const maxOrder = await tx.folder.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true },
          })

          const newFolder = await tx.folder.create({
            data: {
              name: folder.name,
              order: (maxOrder?.order ?? -1) + 1,
            },
          })

          folderMap.set(folder.name, newFolder.id)
        }
      }

      // Import validated feeds
      for (const feedData of validatedFeeds) {
        // Check duplicate
        const existing = await tx.feed.findUnique({
          where: { url: feedData.url },
        })

        if (existing) {
          skipped++
          continue
        }

        // Get max order for new feed
        const maxOrder = await tx.feed.findFirst({
          orderBy: { order: 'desc' },
          select: { order: true },
        })

        // Create feed
        await tx.feed.create({
          data: {
            url: feedData.url,
            title: feedData.title,
            folderId: feedData.folderName
              ? folderMap.get(feedData.folderName) ?? null
              : null,
            order: (maxOrder?.order ?? -1) + 1,
            nextCheckAt: new Date(),
            websubHub: feedData.hubUrl,
            websubTopic: feedData.topicUrl,
          },
        })

        imported++
      }

      return { imported, skipped, errors }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('OPML import error:', error)
    const errorMessage = error.message || 'Unknown error'
    return NextResponse.json(
      { error: `Import failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}
