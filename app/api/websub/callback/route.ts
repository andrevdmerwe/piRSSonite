import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySignature } from '@/lib/utils/websubUtils'
import { parseAndStoreFeed } from '@/lib/utils/refreshUtils'

/**
 * GET handler for WebSub hub verification challenges
 * Hub sends this to verify subscription intent
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const topic = searchParams.get('hub.topic')
  const challenge = searchParams.get('hub.challenge')
  const leaseSeconds = searchParams.get('hub.lease_seconds')

  // Validate required parameters
  if (!mode || !topic || !challenge) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    )
  }

  // Find subscription by topic
  const subscription = await prisma.webSubSubscription.findFirst({
    where: { topicUrl: topic }
  })

  if (!subscription) {
    return NextResponse.json(
      { error: 'Unknown topic' },
      { status: 404 }
    )
  }

  // Handle subscribe vs unsubscribe
  if (mode === 'subscribe') {
    // Update subscription with hub-provided lease
    const lease = parseInt(leaseSeconds || '432000')
    await prisma.webSubSubscription.update({
      where: { id: subscription.id },
      data: {
        leaseSeconds: lease,
        expiresAt: new Date(Date.now() + lease * 1000),
        isActive: true, // Subscription confirmed
        errorCount: 0,
        lastError: null
      }
    })
  } else if (mode === 'unsubscribe') {
    await prisma.webSubSubscription.update({
      where: { id: subscription.id },
      data: { isActive: false }
    })
  }

  // Return challenge to confirm
  return new NextResponse(challenge, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}

/**
 * POST handler for WebSub content push notifications
 * Hub sends this when feed has new content
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature')

    // Extract topic from XML content
    // Try various formats: <link rel="self" ...> or <atom:link rel="self" ...>
    const topicMatch =
      body.match(/<link[^>]*rel=["']self["'][^>]*href=["']([^"']+)["']/i) ||
      body.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']self["']/i) ||
      body.match(/<atom:link[^>]*rel=["']self["'][^>]*href=["']([^"']+)["']/i) ||
      body.match(/<atom:link[^>]*href=["']([^"']+)["'][^>]*rel=["']self["']/i)

    const topic = topicMatch ? topicMatch[1] : null

    if (!topic) {
      return NextResponse.json(
        { error: 'Cannot determine topic' },
        { status: 400 }
      )
    }

    // Find active subscription
    const subscription = await prisma.webSubSubscription.findFirst({
      where: { topicUrl: topic, isActive: true },
      include: { feed: true }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      )
    }

    // Verify HMAC-SHA256 signature if present
    if (signature) {
      const [algorithm, _] = signature.split('=')

      if (algorithm !== 'sha256') {
        return NextResponse.json(
          { error: 'Unsupported algorithm' },
          { status: 400 }
        )
      }

      if (!verifySignature(body, signature, subscription.secret)) {
        console.error('Invalid WebSub signature:', {
          feedId: subscription.feedId,
          topic: subscription.topicUrl
        })
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        )
      }
    }

    // Parse and store entries
    try {
      await parseAndStoreFeed(subscription.feed.id, body)
    } catch (error) {
      console.error('WebSub content parse failed:', error)
      return NextResponse.json(
        { error: 'Invalid XML' },
        { status: 400 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('WebSub callback error:', error)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
