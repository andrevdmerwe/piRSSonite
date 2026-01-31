import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subscribeToWebSub } from '@/lib/utils/websubUtils'

interface RenewalResult {
  feedId: number
  status: 'renewed' | 'failed'
  error?: string
  errorCount?: number
  newExpiresAt?: string
}

/**
 * POST handler to renew expiring WebSub subscriptions
 * Processes subscriptions expiring within 2 days
 */
export async function POST() {
  try {
    // Find subscriptions expiring within 2 days
    const expiringSubscriptions = await prisma.webSubSubscription.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { expiresAt: 'asc' },
      take: 20 // Batch processing
    })

    const results: RenewalResult[] = []

    for (const sub of expiringSubscriptions) {
      try {
        // Attempt to renew subscription
        await subscribeToWebSub({
          feedId: sub.feedId,
          hubUrl: sub.hubUrl,
          topicUrl: sub.topicUrl
        })

        results.push({
          feedId: sub.feedId,
          status: 'renewed',
          newExpiresAt: new Date(Date.now() + sub.leaseSeconds * 1000).toISOString()
        })
      } catch (error: any) {
        // Handle renewal failure
        const newErrorCount = sub.errorCount + 1
        const isActive = newErrorCount < 5 // Deactivate after 5 failures

        await prisma.webSubSubscription.update({
          where: { id: sub.id },
          data: {
            errorCount: newErrorCount,
            lastError: error.message || 'Unknown error',
            isActive
          }
        })

        results.push({
          feedId: sub.feedId,
          status: 'failed',
          error: error.message || 'Unknown error',
          errorCount: newErrorCount
        })
      }
    }

    const renewedCount = results.filter(r => r.status === 'renewed').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      renewed: renewedCount,
      failed: failedCount,
      results
    })
  } catch (error) {
    console.error('Renewal endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to process renewals' },
      { status: 500 }
    )
  }
}
