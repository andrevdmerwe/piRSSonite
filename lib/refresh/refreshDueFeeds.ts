import { prisma } from '@/lib/prisma'
import { fetchAndParseFeed, calculateNextCheckTime, storeNewEntries } from '@/lib/utils/refreshUtils'
import { RefreshResult } from '@/lib/types'

const BATCH_SIZE = 10
const MAX_FEEDS_PER_RUN = 50
const MAX_ERROR_LENGTH = 500

// One run at a time per process. The scheduler and a browser click can
// overlap; a caller that arrives mid-run waits for that run's result instead
// of fetching the same feeds again. Kept on globalThis because Next.js loads
// this module once for instrumentation.ts and again for the route handlers.
const globalForRefresh = globalThis as unknown as { pirssoniteRefreshInFlight?: Promise<RefreshResult> }

export function refreshDueFeeds(): Promise<RefreshResult> {
  if (!globalForRefresh.pirssoniteRefreshInFlight) {
    globalForRefresh.pirssoniteRefreshInFlight = runRefresh().finally(() => {
      globalForRefresh.pirssoniteRefreshInFlight = undefined
    })
  }
  return globalForRefresh.pirssoniteRefreshInFlight
}

/**
 * One line, at most 500 characters. Prisma errors span many lines and echo
 * the whole query (entry content included); their last line is the reason.
 */
function summariseError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const lines = message.split('\n').map(line => line.trim()).filter(Boolean)
  const summary = lines.length > 1 && lines[0].startsWith('Invalid `prisma')
    ? lines[lines.length - 1]
    : lines.join(' ')
  return (summary || 'Unknown error').slice(0, MAX_ERROR_LENGTH)
}

async function runRefresh(): Promise<RefreshResult> {
  const result: RefreshResult = { refreshed: 0, errors: [], newEntries: 0 }
  const now = new Date()

  // Due feeds that are not paused. Feeds with an active WebSub subscription
  // are skipped: the hub pushes their content to /api/websub/callback.
  const feedsToRefresh = await prisma.feed.findMany({
    where: {
      AND: [
        {
          OR: [
            { webSubSubscription: null },
            { webSubSubscription: { isActive: false } },
          ],
        },
        { nextCheckAt: { lte: now } },
        { isAvailable: true },
      ],
    },
    orderBy: { nextCheckAt: 'asc' },
    take: MAX_FEEDS_PER_RUN,
  })

  for (let i = 0; i < feedsToRefresh.length; i += BATCH_SIZE) {
    const batch = feedsToRefresh.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (feed) => {
        try {
          const parsedFeed = await fetchAndParseFeed(feed.url)

          const inserted = await prisma.$transaction(async (tx) => {
            const count = await storeNewEntries(feed.id, parsedFeed.entries, tx)

            await tx.feed.update({
              where: { id: feed.id },
              data: {
                // Keep a title the user edited
                ...(feed.customTitle ? {} : { title: parsedFeed.title }),
                lastFetched: new Date(),
                nextCheckAt: calculateNextCheckTime(0),
                failureCount: 0,
                lastError: null,
                websubHub: parsedFeed.hubUrl || feed.websubHub,
                websubTopic: parsedFeed.topicUrl || feed.websubTopic,
              },
            })

            return count
          })

          result.refreshed++
          result.newEntries = (result.newEntries ?? 0) + inserted
        } catch (error) {
          // Back off and record why. The back-off caps at 64 hours, so a dead
          // feed costs one request every few days; it is never switched off.
          const failureCount = feed.failureCount + 1
          const errorMessage = summariseError(error)

          try {
            await prisma.feed.update({
              where: { id: feed.id },
              data: {
                failureCount,
                nextCheckAt: calculateNextCheckTime(failureCount),
                lastError: errorMessage,
                lastErrorAt: new Date(),
              },
            })
          } catch (updateError) {
            console.error(`[refresh] could not record failure for feed ${feed.id}:`, updateError)
          }

          result.errors.push(`${feed.title} (${feed.url}): ${errorMessage}`)
        }
      })
    )
  }

  return result
}
