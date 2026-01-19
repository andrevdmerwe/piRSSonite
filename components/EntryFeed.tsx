'use client'

import { useState, useEffect } from 'react'
import ArticleCard from './ArticleCard'

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
}

export default function EntryFeed({ feedId, folderId }: EntryFeedProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cardWidth, setCardWidth] = useState(700)

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
        let url = '/api/entries?limit=50'
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch entries:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [feedId, folderId])

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

  const unreadEntries = entries.filter(e => !e.isRead)

  if (entries.length === 0) {
    return (
      <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64">
        <div className="text-text-muted">no_entries_found</div>
      </div>
    )
  }

  if (unreadEntries.length === 0) {
    return (
      <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto flex items-center justify-center h-64">
        <div className="text-text-muted">no_unread_feeds</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: `${cardWidth}px` }} className="mx-auto space-y-4">
      {unreadEntries.map((entry) => (
        <ArticleCard key={entry.id} entry={entry} />
      ))}
      {/* Spacer to allow last articles to scroll past viewport top */}
      <div className="h-screen" aria-hidden="true"></div>
    </div>
  )
}
