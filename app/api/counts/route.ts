import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateUnreadCounts } from '@/lib/utils/counterUtils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const counts = await calculateUnreadCounts(prisma)
    return NextResponse.json(counts)
  } catch (error) {
    console.error('Counts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 }
    )
  }
}
