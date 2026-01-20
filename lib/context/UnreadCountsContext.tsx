'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { UnreadCounts } from '../types'

interface UnreadCountsContextType {
  counts: UnreadCounts | null
  loading: boolean
  refetchCounts: () => Promise<void>
}

const UnreadCountsContext = createContext<UnreadCountsContextType | undefined>(undefined)

export function UnreadCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<UnreadCounts | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/counts', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setCounts(data)
      }
    } catch (error) {
      console.error('Failed to fetch counts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetchCounts = useCallback(async () => {
    await fetchCounts()
  }, [fetchCounts])

  useEffect(() => {
    // Initial fetch
    fetchCounts()

    // Poll every 30 seconds
    const interval = setInterval(fetchCounts, 30000)

    return () => clearInterval(interval)
  }, [fetchCounts])

  return (
    <UnreadCountsContext.Provider value={{ counts, loading, refetchCounts }}>
      {children}
    </UnreadCountsContext.Provider>
  )
}

export function useUnreadCounts() {
  const context = useContext(UnreadCountsContext)
  if (context === undefined) {
    throw new Error('useUnreadCounts must be used within UnreadCountsProvider')
  }
  return context
}
