import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const feedId = searchParams.get('feedId')
    const folderId = searchParams.get('folderId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (feedId) {
      // Filter by specific feed
      where.feedId = parseInt(feedId)
    } else if (folderId) {
      // Filter by folder: get all feeds in folder, then filter entries
      const folderIdNum = parseInt(folderId)
      const feedsInFolder = await prisma.feed.findMany({
        where: { folderId: folderIdNum },
        select: { id: true }
      })

      const feedIds = feedsInFolder.map(f => f.id)

      if (feedIds.length === 0) {
        // Empty folder
        return NextResponse.json([])
      }

      where.feedId = { in: feedIds }
    }
    // If neither feedId nor folderId: all_items (no filter)

    // Fetch entries with feed information
    const entries = await prisma.entry.findMany({
      where,
      include: {
        feed: {
          select: {
            title: true,
            id: true,
          },
        },
      },
      orderBy: {
        published: 'desc',
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Entries fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    )
  }
}
