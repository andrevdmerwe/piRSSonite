import { refreshDueFeeds } from './refreshDueFeeds'

const FIRST_RUN_DELAY_MS = 30_000
const DEFAULT_TICK_MS = 5 * 60 * 1000

const globalForScheduler = globalThis as unknown as { pirssoniteSchedulerStarted?: boolean }

/**
 * Refresh due feeds on the server, with or without a browser tab open.
 * Each tick refreshes only feeds whose nextCheckAt has passed, so the tick
 * length is how often due feeds are noticed, not how often feeds are polled.
 */
export function startRefreshScheduler(): void {
  if (globalForScheduler.pirssoniteSchedulerStarted) return
  globalForScheduler.pirssoniteSchedulerStarted = true

  const parsed = Number(process.env.REFRESH_TICK_MS)
  const tickMs = Number.isFinite(parsed) && parsed >= 10_000 ? parsed : DEFAULT_TICK_MS

  console.log(`[refresh] scheduler started: first run in ${FIRST_RUN_DELAY_MS / 1000}s, then every ${tickMs / 1000}s`)

  setTimeout(() => {
    void tick()
    setInterval(() => void tick(), tickMs)
  }, FIRST_RUN_DELAY_MS)
}

async function tick(): Promise<void> {
  try {
    const result = await refreshDueFeeds()
    if (result.refreshed === 0 && result.errors.length === 0) return

    console.log(
      `[refresh] ${result.refreshed} refreshed, ${result.newEntries ?? 0} new entries, ${result.errors.length} errors`
    )
    for (const error of result.errors) {
      console.log(`[refresh]   error: ${error}`)
    }
  } catch (error) {
    console.error('[refresh] tick failed:', error)
  }
}
