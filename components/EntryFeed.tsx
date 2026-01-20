'use client'

import { useState, useEffect, useCallback } from 'react'
import ArticleCard from './ArticleCard'
import { useUnreadCounts } from '@/lib/context/UnreadCountsContext'
import { toSnakeCase } from '@/lib/utils/textUtils'

interface Entry {
  id: number
  title: string
  url: string
  content: string
  published: Date
  isRead: boolean
  isStarred: boolean
  feed: {
    title: string
    id: number
  }
}

interface EntryFeedProps {
  feedId?: number
  folderId?: number
  selectedName?: string
}

export default function EntryFeed({ feedId, folderId, selectedName }: EntryFeedProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cardWidth, setCardWidth] = useState(700)
  const [hadUnreadOnFetch, setHadUnreadOnFetch] = useState(true) // Track if there were unread entries when fetched
  const { counts } = useUnreadCounts()

  // Load article width from localStorage
  useEffect(() => {
    const loadWidth = () => {
      try {
        const saved = localStorage.getItem('pirssonite_card_max_width')
        if (saved) {
          setCardWidth(parseInt(saved))
        }
      } catch (error) {
        console.error('Failed to load article width:', error)
      }
    }

    loadWidth()

    // Listen for width changes from settings modal
    const handleWidthChange = () => {
      loadWidth()
    }

    window.addEventListener('articleWidthChanged', handleWidthChange)
    return () => {
      window.removeEventListener('articleWidthChanged', handleWidthChange)
    }
  }, [])

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true)
      setError(null)

      try {
        let url = '/api/entries?limit=1000'
        if (feedId) {
          url += `&feedId=${feedId}`
        } else if (folderId) {
          url += `&folderId=${folderId}`
        }

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch entries')
        }

        const data = await response.json()
        setEntries(data)
        // Track if there were any unread entries at fetch time
        setHadUnreadOnFetch(data.length > 0 && data.some((e: Entry) => !e.isRead))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch entries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [feedId, folderId])

  // Callback when an entry is marked as read - update local state
  // Must be before conditional returns to maintain hook order
  const handleMarkRead = useCallback((entryId: number) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, isRead: true } : e
    ))
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64">
        <div className="text-text-secondary">loading_entries...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64">
        <div className="text-text-muted">no_entries_found</div>
      </div>
    )
  }

  // Only show "no_unread_feeds" if there were no unread entries when fetched
  // (not after scrolling through them all - that case shows the entries still)
  if (!hadUnreadOnFetch) {
    return (
      <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64">
        <div className="text-text-muted">no_unread_feeds</div>
      </div>
    )
  }

  // Calculate unread count based on selection
  const getUnreadCount = () => {
    if (!counts) return 0
    if (feedId) return counts.byFeed[feedId] || 0
    if (folderId) return counts.byFolder[folderId] || 0
    return counts.total
  }

  const unreadCount = getUnreadCount()
  const displayName = toSnakeCase(selectedName || 'all_items')

  return (
    <>
      {/* Sticky Header Wrapper - Transparent bg extends to top for clean scroll */}
      <div className="sticky top-0 z-10 pt-6 pb-4 bg-bg-main">
        {/* Styled Header - Matches card width */}
        <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto bg-bg-panel border-b-2 border-accent-cyan/30 shadow-lg rounded-lg px-6">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-accent-cyan">{displayName}</h2>
              {unreadCount > 0 && (
                <span className="text-sm font-semibold bg-accent-purple bg-opacity-20 text-badge-text px-3 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Articles Container */}
      <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto">
        <div className="space-y-4">
          {entries.map((entry) => (
            <ArticleCard key={entry.id} entry={entry} onMarkRead={handleMarkRead} />
          ))}
        </div>
        {/* Spacer to allow last articles to scroll past viewport top */}
        <div className="h-screen" aria-hidden="true"></div>
      </div>
    </>
  )
}
