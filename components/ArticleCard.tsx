'use client'

import { useState, useEffect, useRef, RefObject } from 'react'
import { useEntryState } from '@/lib/hooks/useEntryState'
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
  }
}

interface ArticleCardProps {
  entry: Entry
  onMarkRead?: (entryId: number) => void
  scrollContainerRef?: RefObject<HTMLDivElement | null>
}

export default function ArticleCard({ entry, onMarkRead, scrollContainerRef }: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { isRead, isStarred, toggleStar, markRead } = useEntryState(entry.id, {
    isRead: entry.isRead,
    isStarred: entry.isStarred,
  })

  // Scroll detection - mark as read when scrolled past scroll container top
  useEffect(() => {
    if (isRead || !cardRef.current) return

    const scrollRoot = scrollContainerRef?.current || null

    const observer = new IntersectionObserver(
      (observerEntries) => {
        observerEntries.forEach((obsEntry) => {
          if (!obsEntry.isIntersecting && !isRead) {
            const rootBounds = obsEntry.rootBounds
            if (rootBounds && obsEntry.boundingClientRect.bottom < rootBounds.top + 50) {
              markRead().then(() => onMarkRead?.(entry.id)).catch(console.error)
            }
          }
        })
      },
      {
        threshold: 0,
        root: scrollRoot,
        rootMargin: '0px 0px -95% 0px',
      }
    )

    observer.observe(cardRef.current)

    return () => {
      observer.disconnect()
    }
  }, [isRead, markRead, scrollContainerRef, entry.id, onMarkRead])

  const handleTitleClick = async () => {
    await markRead()
    onMarkRead?.(entry.id)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return new Date(date).toLocaleDateString()
  }

  return (
    <article
      ref={cardRef}
      className="bg-bg-card backdrop-blur-glass border border-border-card rounded-lg p-4 mb-3 shadow-card hover:bg-bg-card-hover hover:border-border-card-hover hover:shadow-card-hover transition-all duration-200 cursor-pointer"
      style={{ backdropFilter: 'var(--backdrop-blur)' }}
      data-entry-id={entry.id}
      data-is-read={isRead}
    >
      {/* Header - Status & Metadata */}
      <div className="flex items-center justify-between gap-2 text-xs mb-3">
        <div className="flex items-center gap-2">
          {isRead ? (
            <span className="bg-accent-read text-bg-primary px-2 py-1 rounded font-bold font-badge" style={{ fontSize: 'var(--font-size-badge)' }}>
              read
            </span>
          ) : (
            <span className="bg-accent-unread text-accent-unread-text px-2 py-1 rounded font-bold font-badge" style={{ fontSize: 'var(--font-size-badge)' }}>
              unread
            </span>
          )}
          <span className="text-text-secondary">♦</span>
          <span className="text-text-status">{toSnakeCase(entry.feed.title)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-dimmed">{formatDate(entry.published)}</span>
          <button
            onClick={toggleStar}
            className="text-text-dimmed hover:text-accent-unread transition-colors"
            title={isStarred ? 'unstar' : 'star'}
          >
            {isStarred ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Title - Click to open in browser */}
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleTitleClick}
        className="block hover:text-accent-link transition-colors no-underline"
      >
        <h3 className="font-bold text-text-primary mb-2 line-clamp-2 font-article-heading" style={{ fontSize: 'var(--font-size-article-heading)' }}>
          {entry.title}
        </h3>
      </a>

      {/* Content - show preview or full based on expansion */}
      <div
        className={`mb-3 opacity-90 leading-relaxed font-article-body ${isExpanded ? '' : 'line-clamp-3'}`}
        style={{ fontSize: 'var(--font-size-article-body)' }}
      >
        <div
          className="text-text-secondary"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
      </div>

      {/* Footer - Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border-divider">
        <div className="flex items-center gap-3">
          <span className="text-text-status text-xs">rss</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-text-dimmed hover:text-text-secondary transition-colors"
          >
            {isExpanded ? '▲ collapse' : '▼ expand'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {!isRead && (
            <button
              onClick={async () => { await markRead(); onMarkRead?.(entry.id) }}
              className="text-xs text-text-dimmed hover:text-text-secondary transition-colors"
            >
              mark_as_read
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
