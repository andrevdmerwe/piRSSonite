import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const feedId = parseInt(body.feedId)

    if (isNaN(feedId)) {
      return NextResponse.json(
        { error: 'Invalid feed ID' },
        { status: 400 }
      )
    }

    // Mark all unread entries for this feed as read
    const result = await prisma.entry.updateMany({
      where: {
        feedId: feedId,
        isRead: false,
      },
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
