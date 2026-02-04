import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const feedId = body.feedId ? parseInt(body.feedId) : null
    const folderId = body.folderId ? parseInt(body.folderId) : null

    // Build where clause based on provided params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = { isRead: false }

    if (feedId && !isNaN(feedId)) {
      // Clear entries for a specific feed
      whereClause.feedId = feedId
    } else if (folderId && !isNaN(folderId)) {
      // Clear entries for all feeds in a specific folder
      whereClause.feed = { folderId: folderId }
    }
    // If neither feedId nor folderId, clear all unread entries

    // Mark all matching unread entries as read
    const result = await prisma.entry.updateMany({
      where: whereClause,
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Bulk clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear entries' },
      { status: 500 }
    )
  }
}
