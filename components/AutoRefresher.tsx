'use client'

import { useEffect } from 'react'
import { refreshFeeds } from '@/lib/utils/refreshClient'

/**
 * Refresh due feeds once when the app opens. The server refreshes on its own
 * schedule (lib/refresh/scheduler.ts); this only pulls in anything due right
 * now so the first view is current.
 */
export default function AutoRefresher() {
  useEffect(() => {
    // Delay by 2 seconds so the UI becomes interactive first
    const timeout = setTimeout(() => {
      refreshFeeds()
        .then(data => console.log('Initial refresh:', data))
        .catch(err => console.error('Refresh error:', err))
    }, 2000)

    return () => clearTimeout(timeout)
  }, [])

  return null
}
