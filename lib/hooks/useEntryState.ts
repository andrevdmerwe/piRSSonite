'use client'

import { useState, useCallback } from 'react'
import { useUnreadCounts } from '../context/UnreadCountsContext'

interface EntryState {
  isRead: boolean
  isStarred: boolean
}

export function useEntryState(entryId: number, initialState: EntryState) {
  const [isRead, setIsRead] = useState(initialState.isRead)
  const [isStarred, setIsStarred] = useState(initialState.isStarred)
  const [isUpdating, setIsUpdating] = useState(false)
  const { refetchCounts } = useUnreadCounts()

  const updateEntry = useCallback(async (updates: Partial<EntryState>) => {
    const prevRead = isRead
    const prevStarred = isStarred

    // Optimistic update
    if (updates.isRead !== undefined) setIsRead(updates.isRead)
    if (updates.isStarred !== undefined) setIsStarred(updates.isStarred)

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update entry')
      }

      // Refetch counts if read state changed
      if (updates.isRead !== undefined && updates.isRead !== prevRead) {
        await refetchCounts()
      }
    } catch (error) {
      // Rollback on error
      setIsRead(prevRead)
      setIsStarred(prevStarred)
      console.error('Failed to update entry:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [entryId, isRead, isStarred, refetchCounts])

  const toggleRead = useCallback(async () => {
    await updateEntry({ isRead: !isRead })
  }, [isRead, updateEntry])

  const toggleStar = useCallback(async () => {
    await updateEntry({ isStarred: !isStarred })
  }, [isStarred, updateEntry])

  const markRead = useCallback(async () => {
    if (!isRead) {
      await updateEntry({ isRead: true })
    }
  }, [isRead, updateEntry])

  return {
    isRead,
    isStarred,
    isUpdating,
    toggleRead,
    toggleStar,
    markRead,
    updateEntry,
  }
}
