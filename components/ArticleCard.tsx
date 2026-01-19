'use client'

import { useState, useEffect, useRef } from 'react'
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
}

export default function ArticleCard({ entry }: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { isRead, isStarred, toggleStar, markRead } = useEntryState(entry.id, {
    isRead: entry.isRead,
    isStarred: entry.isStarred,
  })

  // Scroll detection - mark as read when scrolled past viewport top
  useEffect(() => {
    if (isRead || !cardRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if entry has scrolled past the top of viewport
          if (entry.boundingClientRect.bottom < 0 && !isRead) {
            markRead().catch(console.error)
          }
        })
      },
      {
        threshold: 0,
        root: null,
        rootMargin: '0px',
      }
    )

    observer.observe(cardRef.current)

    return () => {
      observer.disconnect()
    }
  }, [isRead, markRead])

  const handleTitleClick = async () => {
    // Mark as read when title is clicked
    // Browser will handle the link opening natively
    await markRead()
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
      className="bg-bg-card border border-accent-border rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow"
      data-entry-id={entry.id}
      data-is-read={isRead}
    >
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
        {!isRead && (
          <span className="bg-badge-bg text-accent-purple px-2 py-1 rounded-full font-semibold">
            unread
          </span>
        )}
        <span>{toSnakeCase(entry.feed.title)}</span>
        <span>·</span>
        <span>{formatDate(entry.published)}</span>
      </div>

      {/* Title - Click to open in browser */}
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleTitleClick}
        className="text-lg font-semibold text-text-primary mb-2 block hover:text-accent-cyan transition-colors no-underline"
      >
        {entry.title}
      </a>

      {/* Content - show preview or full based on expansion */}
      <div
        className={`text-sm text-text-secondary mb-3 ${
          isExpanded ? '' : 'line-clamp-3'
        }`}
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      {/* Footer - Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border-soft">
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs hover:bg-bg-accent transition-colors"
            title={isExpanded ? 'collapse' : 'expand'}
          >
            <span className="text-text-secondary">
              {isExpanded ? '▲' : '▼'}
            </span>
            <span className="text-text-secondary">{isExpanded ? 'collapse' : 'expand'}</span>
          </button>

          <button
            onClick={toggleStar}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs hover:bg-bg-accent transition-colors"
            title={isStarred ? 'unstar' : 'star'}
          >
            <span className={isStarred ? 'text-yellow-400' : 'text-text-muted'}>
              {isStarred ? '★' : '☆'}
            </span>
            <span className="text-text-secondary">{isStarred ? 'starred' : 'star'}</span>
          </button>

          {!isRead && (
            <button
              onClick={markRead}
              className="px-3 py-1 rounded text-xs text-text-secondary hover:bg-bg-accent transition-colors"
            >
              mark_as_read
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
