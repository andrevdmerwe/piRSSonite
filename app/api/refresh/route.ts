import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAndParseFeed, calculateNextCheckTime, truncateOldEntries } from '@/lib/utils/refreshUtils'
import { RefreshResult } from '@/lib/types'

export async function POST() {
  try {
    const result: RefreshResult = {
      refreshed: 0,
      errors: [],
    }

    // Find all feeds that are due for a check and are available
    // Skip feeds with active WebSub subscriptions (they receive push notifications)
    const feedsToRefresh = await prisma.feed.findMany({
      where: {
        AND: [
          {
            OR: [
              { webSubSubscription: null },
              { webSubSubscription: { isActive: false } }
            ]
          },
          { nextCheckAt: { lte: new Date() } },
          { isAvailable: true }
        ]
      },
      include: { webSubSubscription: true },
      take: 50, // Limit to 50 feeds per refresh cycle
    })

    // Log WebSub exclusion statistics
    const totalDueFeeds = await prisma.feed.count({
      where: {
        nextCheckAt: { lte: new Date() },
        isAvailable: true
      }
    })
    const webSubActiveCount = totalDueFeeds - feedsToRefresh.length
    if (webSubActiveCount > 0) {
      console.log(`Skipping ${webSubActiveCount} feed(s) with active WebSub subscriptions`)
    }

    // Process feeds in batches of 10
    const batchSize = 10
    for (let i = 0; i < feedsToRefresh.length; i += batchSize) {
      const batch = feedsToRefresh.slice(i, i + batchSize)

      await Promise.allSettled(
        batch.map(async (feed) => {
          try {
            // Fetch and parse the feed
            const parsedFeed = await fetchAndParseFeed(feed.url)

            // Update feed and add new entries in a transaction
            await prisma.$transaction(async (tx) => {
              // Add new entries (manually skip duplicates for SQLite)
              if (parsedFeed.entries.length > 0) {
                // Get existing entry URLs for this feed
                const existingEntries = await tx.entry.findMany({
                  where: { feedId: feed.id },
                  select: { url: true },
                })
                const existingUrls = new Set(existingEntries.map(e => e.url))

                // Filter out entries that already exist
                const newEntries = parsedFeed.entries.filter(
                  entry => !existingUrls.has(entry.url)
                )

                // Insert only new entries
                if (newEntries.length > 0) {
                  for (const entry of newEntries) {
                    await tx.entry.create({
                      data: {
                        url: entry.url,
                        title: entry.title,
                        content: entry.content,
                        published: entry.published,
                        feedId: feed.id,
                      },
                    })
                  }
                }

                // Truncate old entries to keep only 200 most recent
                await truncateOldEntries(feed.id, tx)
              }

              // Update feed metadata - success
              // Only update title if customTitle is false (user hasn't edited it)
              await tx.feed.update({
                where: { id: feed.id },
                data: {
                  ...(feed.customTitle ? {} : { title: parsedFeed.title }),
                  lastFetched: new Date(),
                  nextCheckAt: calculateNextCheckTime(0), // Reset failure count
                  failureCount: 0,
                  websubHub: parsedFeed.hubUrl || feed.websubHub,
                  websubTopic: parsedFeed.topicUrl || feed.websubTopic,
                },
              })
            })

            result.refreshed++
          } catch (error) {
            // Handle feed fetch failure
            const newFailureCount = feed.failureCount + 1
            const isAvailable = newFailureCount < 15 // Mark unavailable after 15 failures

            await prisma.feed.update({
              where: { id: feed.id },
              data: {
                failureCount: newFailureCount,
                nextCheckAt: calculateNextCheckTime(newFailureCount),
                isAvailable,
              },
            })

            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            result.errors.push(`${feed.title} (${feed.url}): ${errorMessage}`)
          }
        })
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh feeds' },
      { status: 500 }
    )
  }
}
