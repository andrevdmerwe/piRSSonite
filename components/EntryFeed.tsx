'use client'

import { useState, useEffect, useCallback, RefObject } from 'react'
import ArticleCard from './ArticleCard'
import { useUnreadCounts } from '@/lib/context/UnreadCountsContext'
import { useTheme } from '@/lib/context/ThemeContext'
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
  sidebarWidth?: number
  scrollContainerRef?: RefObject<HTMLDivElement | null>
}

export default function EntryFeed({ feedId, folderId, selectedName, sidebarWidth = 288, scrollContainerRef }: EntryFeedProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cardWidth, setCardWidth] = useState(700)
  const [hadUnreadOnFetch, setHadUnreadOnFetch] = useState(true) // Track if there were unread entries when fetched
  const { counts } = useUnreadCounts()
  const { watermarkEnabled, watermarkColor } = useTheme()

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

        const response = await fetch(url, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to fetch entries')
        }

        const data = await response.json()
        console.log('[EntryFeed] Fetched', data.length, 'entries', data)
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

  // Calculate unread count based on selection (from context - for sidebar sync)
  const getUnreadCount = () => {
    if (!counts) return 0
    if (feedId) return counts.byFeed[feedId] || 0
    if (folderId) return counts.byFolder[folderId] || 0
    return counts.total
  }

  // Local unread count from entries array - updates immediately on mark read
  const localUnreadCount = entries.filter(e => !e.isRead).length

  // Use local count for immediate feedback in header, context count for sidebar
  const unreadCount = localUnreadCount
  const displayName = toSnakeCase(selectedName || 'all_items')

  return (
    <>
      {/* Watermark Background */}
      {watermarkEnabled && (
        <div
          className="fixed top-0 bottom-0 right-0 pointer-events-none flex flex-col items-center justify-start z-0 pt-32 overflow-hidden"
          style={{ opacity: 0.08, left: sidebarWidth }}
        >
          <svg
            width={cardWidth * 1.75}
            height={cardWidth * 1.75}
            viewBox="0 0 200 200"
            fill="none"
            style={{ minWidth: cardWidth * 1.75, minHeight: cardWidth * 1.75 }}
          >
            <path d="M100 10 L170 45 L170 125 L100 190 L30 125 L30 45 Z" stroke={watermarkColor} strokeWidth="3" fill="none" />
            <path d="M100 10 L100 190" stroke={watermarkColor} strokeWidth="2" opacity="0.8" fill="none" />
            <path d="M30 45 L170 125" stroke={watermarkColor} strokeWidth="2" opacity="0.8" fill="none" />
            <path d="M170 45 L30 125" stroke={watermarkColor} strokeWidth="2" opacity="0.8" fill="none" />
            <path d="M65 27 L100 10 L135 27 L100 60 Z" stroke={watermarkColor} strokeWidth="2" opacity="0.6" fill="none" />
            <path d="M65 163 L100 190 L135 163 L100 140 Z" stroke={watermarkColor} strokeWidth="2" opacity="0.6" fill="none" />
          </svg>
        </div>
      )}

      {loading ? (
        <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64 relative z-1">
          <div className="text-text-secondary">loading_entries...</div>
        </div>
      ) : error ? (
        <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64 relative z-1">
          <div className="text-red-400">Error: {error}</div>
        </div>
      ) : entries.length === 0 ? (
        <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64 relative z-1">
          <div className="text-text-muted">no_entries_found</div>
        </div>
      ) : !hadUnreadOnFetch ? (
        <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64 relative z-1">
          <div className="text-text-muted">no_unread_feeds</div>
        </div>
      ) : (
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
          <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto relative z-1">
            <div className="space-y-4">
              {entries.map((entry) => (
                <ArticleCard key={entry.id} entry={entry} onMarkRead={handleMarkRead} scrollContainerRef={scrollContainerRef} />
              ))}
            </div>
            {/* Spacer to allow last articles to scroll past viewport top */}
            <div className="h-screen" aria-hidden="true"></div>
          </div>
        </>
      )}
    </>
  )
}
