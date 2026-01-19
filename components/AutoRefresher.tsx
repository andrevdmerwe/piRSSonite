'use client'

import { useEffect } from 'react'
import { useUnreadCounts } from '@/lib/context/UnreadCountsContext'

export default function AutoRefresher() {
  const { refetchCounts } = useUnreadCounts()

  useEffect(() => {
    // Delay initial refresh by 2 seconds to allow UI to become interactive
    const initialRefreshTimeout = setTimeout(() => {
      fetch('/api/refresh', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          console.log('Initial refresh:', data)
          // Refetch counts after initial refresh completes
          refetchCounts()
        })
        .catch(err => console.error('Refresh error:', err))
    }, 2000)

    // Then every 15 minutes
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/refresh', { method: 'POST' })
        const data = await response.json()
        console.log('Refresh complete:', data)
        // Refetch counts after periodic refresh
        refetchCounts()
      } catch (err) {
        console.error('Refresh error:', err)
      }
    }, 15 * 60 * 1000) // 15 minutes

    return () => {
      clearTimeout(initialRefreshTimeout)
      clearInterval(interval)
    }
  }, [refetchCounts])

  return null // This component renders nothing
}
