import { NextResponse } from 'next/server'
import { refreshDueFeeds } from '@/lib/refresh/refreshDueFeeds'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    return NextResponse.json(await refreshDueFeeds())
  } catch (error) {
    console.error('[refresh] failed:', error)
    return NextResponse.json(
      { error: 'Failed to refresh feeds' },
      { status: 500 }
    )
  }
}
