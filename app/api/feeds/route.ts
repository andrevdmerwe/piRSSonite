import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAndParseFeed } from '@/lib/utils/refreshUtils'
import { subscribeToWebSub } from '@/lib/utils/websubUtils'

export async function GET() {
  try {
    const feeds = await prisma.feed.findMany({
      orderBy: {
        order: 'asc',
      },
    })
    return NextResponse.json(feeds)
  } catch (error) {
    console.error('Feeds fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, folderId } = body

    // Validate URL format
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL protocol
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'URL must use http:// or https:// protocol' },
          { status: 400 }
        )
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Check for duplicate URL
    const existingFeed = await prisma.feed.findUnique({
      where: { url }
    })

    if (existingFeed) {
      return NextResponse.json(
        { error: 'Feed URL already exists' },
        { status: 400 }
      )
    }

    // Fetch and parse feed to extract title
    let feedData
    try {
      feedData = await fetchAndParseFeed(url)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { error: `Failed to fetch feed: ${errorMessage}` },
        { status: 422 }
      )
    }

    // Validate folder if provided
    if (folderId !== null && folderId !== undefined) {
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

    // Get max order for new feed
    const maxOrderFeed = await prisma.feed.findFirst({
      orderBy: { order: 'desc' }
    })
    const newOrder = maxOrderFeed ? maxOrderFeed.order + 1 : 0

    // Create feed
    const feed = await prisma.feed.create({
      data: {
        url,
        title: feedData.title,
        folderId: folderId || null,
        order: newOrder,
        nextCheckAt: new Date(), // Trigger immediate refresh
        websubHub: feedData.hubUrl || null,
        websubTopic: feedData.topicUrl || null,
      },
    })

    // Async WebSub subscription (don't block response)
    if (feedData.hubUrl && feedData.topicUrl) {
      subscribeToWebSub({
        feedId: feed.id,
        hubUrl: feedData.hubUrl,
        topicUrl: feedData.topicUrl
      }).catch(err => {
        console.error(`WebSub subscription failed for feed ${feed.id}:`, err)
        // Feed creation still succeeds, polling continues
      })
    }

    return NextResponse.json(feed, { status: 201 })
  } catch (error) {
    console.error('Feed creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create feed' },
      { status: 500 }
    )
  }
}
