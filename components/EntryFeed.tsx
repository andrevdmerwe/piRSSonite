'use client'

import { useState, useEffect, useLayoutEffect, useCallback, useRef, RefObject } from 'react'
import ArticleCard from './ArticleCard'
import { useUnreadCounts } from '@/lib/context/UnreadCountsContext'
import { useTheme } from '@/lib/context/ThemeContext'
import { toSnakeCase } from '@/lib/utils/textUtils'
import { refreshFeeds, REFRESHED_EVENT } from '@/lib/utils/refreshClient'

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
  const [viewMode, setViewMode] = useState<'unread' | 'all'>('unread') // Toggle between unread and all
  const { counts, refetchCounts } = useUnreadCounts()
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

  // Entries that arrived after the list was loaded, held back while the
  // reader is scrolled down (see checkForNew)
  const [pendingEntries, setPendingEntries] = useState<Entry[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<{ text: string; detail?: string } | null>(null)

  const entriesRef = useRef<Entry[]>([])
  entriesRef.current = entries
  // Bumped on every selection change so late responses for the old selection are dropped
  const selectionRef = useRef(0)
  // Set by the refresh button: show whatever the refresh brought in, even if scrolled down
  const forceShowNewRef = useRef(false)
  const scrollToTopRef = useRef(false)

  const entriesUrl = useCallback(() => {
    let url = '/api/entries?limit=1000'
    if (feedId) {
      url += `&feedId=${feedId}`
    } else if (folderId) {
      url += `&folderId=${folderId}`
    }
    return url
  }, [feedId, folderId])

  const loadEntries = useCallback(async (url: string): Promise<Entry[]> => {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error('Failed to fetch entries')
    }
    const data = await response.json()
    if (!Array.isArray(data)) {
      throw new Error('API response is not an array')
    }
    return data
  }, [])

  // Full load for the current selection
  const fetchEntries = useCallback(async () => {
    const selection = ++selectionRef.current
    setLoading(true)
    setError(null)
    setPendingEntries([])

    try {
      const data = await loadEntries(entriesUrl())
      if (selection !== selectionRef.current) return

      setEntries(data)
      // Mark which ones were unread at fetch time
      setSessionUnreadIds(new Set<number>(data.filter(e => !e.isRead).map(e => e.id)))
    } catch (err) {
      if (selection !== selectionRef.current) return
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Failed to fetch entries:', err)
    } finally {
      if (selection === selectionRef.current) setLoading(false)
    }
  }, [entriesUrl, loadEntries])

  useEffect(() => {
    fetchEntries()
    // Reset viewMode to unread when feed changes
    setViewMode('unread')
  }, [fetchEntries])

  // Put new entries at the top of the list and jump there
  const showNewEntries = useCallback((fresh: Entry[]) => {
    const known = new Set(entriesRef.current.map(e => e.id))
    const toAdd = fresh.filter(e => !known.has(e.id))
    if (toAdd.length > 0) {
      scrollToTopRef.current = true
      setEntries(prev => [...toAdd, ...prev])
      setSessionUnreadIds(prev => {
        const next = new Set(prev)
        toAdd.filter(e => !e.isRead).forEach(e => next.add(e.id))
        return next
      })
    }
    setPendingEntries([])
  }, [])

  // Scroll before the browser paints and before the new cards' observers
  // run, so cards inserted at the top are never seen as "scrolled past"
  // (which would mark them read unseen).
  useLayoutEffect(() => {
    if (!scrollToTopRef.current) return
    scrollToTopRef.current = false
    const container = scrollContainerRef?.current
    if (container) container.scrollTop = 0
    else window.scrollTo(0, 0)
  }, [entries, scrollContainerRef])

  // Quiet reload after a refresh or when the tab becomes visible. The list is
  // not reordered under the reader: new entries go on top, and only straight
  // away when the list is scrolled to the top; otherwise a pill offers them.
  const checkForNew = useCallback(async (forceShow: boolean) => {
    const selection = selectionRef.current
    try {
      const data = await loadEntries(entriesUrl())
      if (selection !== selectionRef.current) return

      const known = new Set(entriesRef.current.map(e => e.id))
      const fresh = data.filter(e => !known.has(e.id))

      const container = scrollContainerRef?.current
      const scrollTop = container ? container.scrollTop : window.scrollY
      if (forceShow || scrollTop <= 50) {
        showNewEntries(fresh)
      } else {
        setPendingEntries(fresh)
      }
    } catch (err) {
      console.error('Failed to check for new entries:', err)
    }
  }, [entriesUrl, loadEntries, scrollContainerRef, showNewEntries])

  useEffect(() => {
    const onRefreshed = () => {
      const forceShow = forceShowNewRef.current
      forceShowNewRef.current = false
      checkForNew(forceShow)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForNew(false)
    }
    window.addEventListener(REFRESHED_EVENT, onRefreshed)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener(REFRESHED_EVENT, onRefreshed)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [checkForNew])

  // Clear the refresh result after a few seconds
  useEffect(() => {
    if (!refreshMessage) return
    const timeout = setTimeout(() => setRefreshMessage(null), 6000)
    return () => clearTimeout(timeout)
  }, [refreshMessage])

  const handleRefreshClick = async () => {
    if (refreshing) return
    setRefreshing(true)
    setRefreshMessage(null)
    forceShowNewRef.current = true
    try {
      const result = await refreshFeeds()
      const errors = result.errors.length
      setRefreshMessage({
        text: `${result.refreshed} refreshed, ${errors} ${errors === 1 ? 'error' : 'errors'}`,
        detail: errors > 0 ? result.errors.join('\n') : undefined,
      })
    } catch (err) {
      forceShowNewRef.current = false
      console.error('Refresh error:', err)
      setRefreshMessage({ text: 'refresh_failed', detail: err instanceof Error ? err.message : undefined })
    } finally {
      setRefreshing(false)
    }
  }

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
                    <h2 className="font-bold text-accent-link truncate max-w-[300px] font-header" style={{ fontSize: 'var(--font-size-header)' }} title={displayName}>{displayName}</h2>
                    <button
                      onClick={handleRefreshClick}
                      disabled={refreshing}
                      className="p-1.5 rounded-full hover:bg-white/10 text-text-dimmed hover:text-accent-link transition-colors disabled:cursor-wait"
                      title="refresh_feeds"
                    >
                      <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        // Build request body based on current view
                        const body: { feedId?: number; folderId?: number } = {};
                        if (feedId) {
                          body.feedId = feedId;
                        } else if (folderId) {
                          body.folderId = folderId;
                        }
                        // If neither feedId nor folderId, body is empty (mark all globally)

                        try {
                          const response = await fetch('/api/entries/clear', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body),
                          });

                          if (response.ok) {
                            // Update local state to mark all entries as read
                            setEntries(prev => prev.map(e => ({ ...e, isRead: true })));
                            // Clear session unread IDs since all are now read
                            setSessionUnreadIds(new Set());
                            // Refresh sidebar unread counts
                            refetchCounts();
                          }
                        } catch (error) {
                          console.error('Failed to mark all as read:', error);
                        }
                      }}
                      disabled={localUnreadCount === 0}
                      className={`p-1.5 rounded-full transition-colors ${localUnreadCount === 0
                        ? 'text-text-dimmed/30 cursor-not-allowed'
                        : 'text-text-dimmed hover:bg-white/10 hover:text-accent-link'
                        }`}
                      title="mark_all_read"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {refreshing ? (
                      <span className="text-xs text-text-dimmed whitespace-nowrap">refreshing...</span>
                    ) : refreshMessage && (
                      <span className="text-xs text-text-dimmed whitespace-nowrap" title={refreshMessage.detail}>
                        {refreshMessage.text}
                      </span>
                    )}
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
            {pendingEntries.length > 0 && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => showNewEntries(pendingEntries)}
                  className="text-sm font-semibold bg-accent-unread text-accent-unread-text px-4 py-1 rounded-full shadow-card hover:opacity-90 transition-opacity"
                >
                  {pendingEntries.length} new {pendingEntries.length === 1 ? 'article' : 'articles'}
                </button>
              </div>
            )}
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

