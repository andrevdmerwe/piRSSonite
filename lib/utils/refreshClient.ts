import { RefreshResult } from '../types'

/** Fired on window after every browser-initiated refresh; detail is the RefreshResult. */
export const REFRESHED_EVENT = 'pirssonite:refreshed'

/** POST /api/refresh, then tell listeners (entry list, counts) to reload. */
export async function refreshFeeds(): Promise<RefreshResult> {
  const response = await fetch('/api/refresh', { method: 'POST' })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`)
  }
  window.dispatchEvent(new CustomEvent<RefreshResult>(REFRESHED_EVENT, { detail: data }))
  return data
}
