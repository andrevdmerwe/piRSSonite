import { PrismaClient } from '@prisma/client'
import { UnreadCounts } from '../types'

/**
 * Calculate unread entry counts aggregated by feed and folder
 * @param prisma - Prisma client instance
 * @returns UnreadCounts object with total, byFolder, and byFeed counts
 */
export async function calculateUnreadCounts(
  prisma: PrismaClient
): Promise<UnreadCounts> {
  // Get unread count per feed using efficient groupBy
  const entryCounts = await prisma.entry.groupBy({
    by: ['feedId'],
    where: {
      isRead: false,
    },
    _count: {
      id: true,
    },
  })

  // Get all feeds with their folder associations
  const feeds = await prisma.feed.findMany({
    select: {
      id: true,
      folderId: true,
    },
  })

  // Build byFeed and byFolder maps, and calculate total
  const byFeed: Record<number, number> = {}
  const byFolder: Record<number, number> = {}
  let total = 0

  // Create a map of feedId to folderId for easy lookup
  const feedToFolderMap = new Map<number, number | null>()
  for (const feed of feeds) {
    feedToFolderMap.set(feed.id, feed.folderId)
  }

  for (const entry of entryCounts) {
    // ONLY count entries if their feed still exists in our feeds list
    if (feedToFolderMap.has(entry.feedId)) {
      const count = entry._count.id
      byFeed[entry.feedId] = count
      total += count

      const folderId = feedToFolderMap.get(entry.feedId)
      if (folderId !== null && folderId !== undefined) {
        if (!byFolder[folderId]) {
          byFolder[folderId] = 0
        }
        byFolder[folderId] += count
      }
    }
  }

  return {
    total,
    byFolder,
    byFeed,
  }

}
