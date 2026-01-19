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

  // Build byFeed map
  const byFeed: Record<number, number> = {}
  let total = 0

  for (const entry of entryCounts) {
    const count = entry._count.id
    byFeed[entry.feedId] = count
    total += count
  }

  // Get all feeds with their folder associations
  const feeds = await prisma.feed.findMany({
    select: {
      id: true,
      folderId: true,
    },
  })

  // Aggregate counts by folder
  const byFolder: Record<number, number> = {}

  for (const feed of feeds) {
    if (feed.folderId !== null && byFeed[feed.id]) {
      if (!byFolder[feed.folderId]) {
        byFolder[feed.folderId] = 0
      }
      byFolder[feed.folderId] += byFeed[feed.id]
    }
  }

  return {
    total,
    byFolder,
    byFeed,
  }
}
