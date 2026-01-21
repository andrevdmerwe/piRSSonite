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
  const [viewMode, setViewMode] = useState<'unread' | 'all'>('unread') // Toggle between unread and all
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

  // Track which IDs were unread when they first appeared in this session
  // to prevent them from vanishing immediately when marked as read.
  const [sessionUnreadIds, setSessionUnreadIds] = useState<Set<number>>(new Set())

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

        // Mark which ones were unread at fetch time
        const unreadIds = new Set<number>(data.filter((e: Entry) => !e.isRead).map((e: Entry) => e.id))
        setSessionUnreadIds(unreadIds)

        // Track if there were any unread entries at fetch time for initial view determination
        setHadUnreadOnFetch(unreadIds.size > 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch entries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
    // Reset viewMode to unread when feed changes
    setViewMode('unread')
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
  const displayName = toSnakeCase(selectedName || 'all_items')

  // Filter entries based on viewMode
  // In 'unread' mode, we show items that were unread at fetch time (sessionUnreadIds)
  // this prevents them from vanishing while the user is reading/scrolling.
  const displayedEntries = viewMode === 'unread'
    ? entries.filter(e => sessionUnreadIds.has(e.id))
    : entries

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
          <div className="text-text-dimmed">no_entries_found</div>
        </div>
      ) : (
        <>
          {/* Sticky Header Wrapper - Transparent bg extends to top for clean scroll */}
          <div className="sticky top-0 z-10 pt-6 pb-4 bg-bg-primary">
            {/* Styled Header - Matches card width */}
            <div style={{ maxWidth: `${cardWidth}px`, backdropFilter: 'var(--backdrop-blur)' }} className="mx-auto bg-bg-card backdrop-blur-glass border border-border-card shadow-card rounded-lg px-6">
              <div className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-accent-link truncate max-w-[300px]" title={displayName}>{displayName}</h2>
                    <button
                      onClick={() => {
                        setLoading(true);
                        // Trigger fetchEntries by changing a dependency or re-running the effect
                        const fetchUrl = `/api/entries?limit=1000${feedId ? `&feedId=${feedId}` : folderId ? `&folderId=${folderId}` : ''}`;
                        fetch(fetchUrl, { cache: 'no-store' })
                          .then(res => res.json())
                          .then(data => {
                            setEntries(data);
                            setHadUnreadOnFetch(data.length > 0 && data.some((e: Entry) => !e.isRead));
                            setLoading(false);
                          });
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10 text-text-dimmed hover:text-accent-link transition-colors"
                      title="refresh"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 text-sm bg-white/5 p-1 rounded-md px-2 border border-border-divider">
                      <button
                        onClick={() => setViewMode('unread')}
                        className={`px-2 py-0.5 rounded transition-colors ${viewMode === 'unread' ? 'bg-accent-link/20 text-accent-link font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
                      >
                        unread
                      </button>
                      <button
                        onClick={() => setViewMode('all')}
                        className={`px-2 py-0.5 rounded transition-colors ${viewMode === 'all' ? 'bg-accent-link/20 text-accent-link font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
                      >
                        all
                      </button>
                    </div>
                    {localUnreadCount > 0 && (
                      <span className="text-sm font-bold bg-accent-unread text-accent-unread-text px-3 py-1 rounded whitespace-nowrap">
                        {localUnreadCount} unread
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Articles Container */}
          <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto relative z-1">
            {displayedEntries.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-text-dimmed">
                  {viewMode === 'unread' ? 'no_unread_entries' : 'no_entries_found'}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedEntries.map((entry) => (
                  <ArticleCard key={entry.id} entry={entry} onMarkRead={handleMarkRead} scrollContainerRef={scrollContainerRef} />
                ))}
              </div>
            )}
            {/* Spacer to allow last articles to scroll past viewport top */}
            <div className="h-screen" aria-hidden="true"></div>
          </div>
        </>
      )}
    </>
  )
}

