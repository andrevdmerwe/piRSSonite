import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unsubscribeFromWebSub } from '@/lib/utils/websubUtils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const feedId = parseInt(id)

    if (isNaN(feedId)) {
      return NextResponse.json(
        { error: 'Invalid feed ID' },
        { status: 400 }
      )
    }

    // Check if feed exists and get subscription if any
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      include: { webSubSubscription: true }
    })

    if (!feed) {
      return NextResponse.json(
        { error: 'Feed not found' },
        { status: 404 }
      )
    }

    // Unsubscribe from WebSub if subscription exists (best effort)
    if (feed.webSubSubscription) {
      try {
        await unsubscribeFromWebSub(feed.webSubSubscription)
      } catch (err) {
        console.error('Unsubscribe failed:', err)
        // Continue with deletion anyway
      }
    }

    // Delete feed (cascades to entries and subscription via Prisma schema)
    await prisma.feed.delete({
      where: { id: feedId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Feed deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete feed' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const feedId = parseInt(id)

    if (isNaN(feedId)) {
      return NextResponse.json(
        { error: 'Invalid feed ID' },
        { status: 400 }
      )
    }

    // Check if feed exists
    const feed = await prisma.feed.findUnique({
      where: { id: feedId }
    })

    if (!feed) {
      return NextResponse.json(
        { error: 'Feed not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { folderId, title } = body

    // Build update data object
    const updateData: { folderId?: number | null; title?: string } = {}

    if (folderId !== undefined) {
      // Validate folder if not null
      if (folderId !== null) {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId }
        })
        if (!folder) {
          return NextResponse.json(
            { error: 'Folder not found' },
            { status: 400 }
          )
        }
      }
      updateData.folderId = folderId
    }

    if (title !== undefined && typeof title === 'string') {
      updateData.title = title
    }

    // Update feed
    const updatedFeed = await prisma.feed.update({
      where: { id: feedId },
      data: updateData
    })

    return NextResponse.json(updatedFeed)
  } catch (error) {
    console.error('Feed update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feed' },
      { status: 500 }
    )
  }
}
