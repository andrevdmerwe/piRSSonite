'use client'

import { useState, useEffect } from 'react'
import { useUnreadCounts } from '@/lib/context/UnreadCountsContext'
import SettingsModal from './SettingsModal'
import { toSnakeCase } from '@/lib/utils/textUtils'

interface Feed {
  id: number
  title: string
  url: string
  folderId: number | null
}

interface Folder {
  id: number
  name: string
}

interface SidebarProps {
  onFeedSelect?: (feedId: number, feedTitle?: string) => void
  onFolderSelect?: (folderId: number, folderName?: string) => void
  selectedFeedId?: number
}

export default function Sidebar({ onFeedSelect, onFolderSelect, selectedFeedId }: SidebarProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Record<number, boolean>>({})
  const [hideEmptyFeeds, setHideEmptyFeeds] = useState(false)
  const { counts } = useUnreadCounts()

  const fetchFeeds = () => {
    fetch('/api/feeds')
      .then((res) => res.json())
      .then(setFeeds)
      .catch(console.error)
  }

  const fetchFolders = () => {
    fetch('/api/folders')
      .then((res) => res.json())
      .then(setFolders)
      .catch(console.error)
  }

  const refreshData = () => {
    fetchFeeds()
    fetchFolders()
  }

  useEffect(() => {
    fetchFolders()
    fetchFeeds()

    // Load folder expanded state from localStorage
    try {
      const saved = localStorage.getItem('pirssonite_folder_state')
      if (saved) {
        setExpandedFolders(JSON.parse(saved))
      }

      // Load hide empty feeds setting
      const savedHideEmpty = localStorage.getItem('pirssonite_hide_empty_feeds')
      if (savedHideEmpty) {
        setHideEmptyFeeds(savedHideEmpty === 'true')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }

    // Listen for hide empty feeds changes from settings modal
    const handleHideEmptyFeedsChange = () => {
      try {
        const savedHideEmpty = localStorage.getItem('pirssonite_hide_empty_feeds')
        if (savedHideEmpty) {
          setHideEmptyFeeds(savedHideEmpty === 'true')
        }
      } catch (error) {
        console.error('Failed to load hide empty feeds setting:', error)
      }
    }

    window.addEventListener('hideEmptyFeedsChanged', handleHideEmptyFeedsChange)
    return () => {
      window.removeEventListener('hideEmptyFeedsChanged', handleHideEmptyFeedsChange)
    }
  }, [])

  // Save folder state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('pirssonite_folder_state', JSON.stringify(expandedFolders))
    } catch (error) {
      console.error('Failed to save folder state:', error)
    }
  }, [expandedFolders])

  const getUnreadCount = (feedId: number) => {
    return counts?.byFeed[feedId] || 0
  }

  const getFolderUnreadCount = (folderId: number) => {
    return counts?.byFolder[folderId] || 0
  }

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const expandAllFolders = () => {
    const allExpanded: Record<number, boolean> = {}
    folders.forEach((folder) => {
      allExpanded[folder.id] = true
    })
    setExpandedFolders(allExpanded)
  }

  const collapseAllFolders = () => {
    const allCollapsed: Record<number, boolean> = {}
    folders.forEach((folder) => {
      allCollapsed[folder.id] = false
    })
    setExpandedFolders(allCollapsed)
  }

  const isFolderExpanded = (folderId: number) => {
    // Default to expanded if not set
    return expandedFolders[folderId] !== false
  }

  // Filter feeds and folders based on hideEmptyFeeds setting
  let rootFeeds = feeds.filter((f) => f.folderId === null)
  let feedsByFolder = folders.map((folder) => ({
    folder,
    feeds: feeds.filter((f) => f.folderId === folder.id),
  }))

  if (hideEmptyFeeds) {
    // Filter out feeds with no unread items
    rootFeeds = rootFeeds.filter((feed) => getUnreadCount(feed.id) > 0)

    // Filter out folders with no unread items and filter feeds within folders
    feedsByFolder = feedsByFolder
      .map((folderData) => ({
        ...folderData,
        feeds: folderData.feeds.filter((feed) => getUnreadCount(feed.id) > 0),
      }))
      .filter((folderData) => getFolderUnreadCount(folderData.folder.id) > 0)
  }

  return (
    <aside className="w-full bg-bg-primary border-r border-border-divider p-4 overflow-y-auto h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-xl font-bold text-accent-link flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2 L20 6 L20 15 L12 22 L4 15 L4 6 Z" />
              <path d="M12 2 L12 22" opacity="0.7" strokeWidth="1" />
              <path d="M4 6 L20 15" opacity="0.7" strokeWidth="1" />
              <path d="M20 6 L4 15" opacity="0.7" strokeWidth="1" />
            </svg>
            piRSSonite
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-text-secondary hover:text-accent-link transition-colors p-1"
            aria-label="Settings"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        {counts && (
          <div className="text-xs text-text-dimmed">
            {counts.total} unread_articles
          </div>
        )}
      </div>

      {/* Views */}
      <div className="mb-6">
        <h4 className="text-xs uppercase tracking-wider text-text-secondary font-semibold mb-3">
          views
        </h4>
        <div
          className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${selectedFeedId === 0 || selectedFeedId === undefined
            ? 'bg-white/5 text-accent-link'
            : 'text-text-primary hover:bg-white/5'
            }`}
          onClick={() => onFeedSelect?.(0, 'all_items')}
        >
          <span>all_items</span>
          {counts && counts.total > 0 && (
            <span className="text-xs font-bold bg-accent-unread text-accent-unread-text px-2 py-0.5 rounded">
              {counts.total}
            </span>
          )}
        </div>
      </div>

      {/* Folders and Feeds */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
            feeds
          </h4>
          {folders.length > 0 && (
            <div className="flex items-center gap-2 text-text-dimmed text-xs">
              <button
                onClick={expandAllFolders}
                className="hover:text-accent-link transition-colors"
                title="Expand all folders"
              >
                [+]
              </button>
              <button
                onClick={collapseAllFolders}
                className="hover:text-accent-link transition-colors"
                title="Collapse all folders"
              >
                [-]
              </button>
            </div>
          )}
        </div>

        {/* Feeds without folders */}
        {rootFeeds.map((feed) => (
          <div
            key={feed.id}
            className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${selectedFeedId === feed.id
              ? 'bg-white/5 text-accent-link'
              : 'text-text-primary hover:bg-white/5'
              }`}
            onClick={() => onFeedSelect?.(feed.id, feed.title)}
          >
            <span className="truncate">{toSnakeCase(feed.title)}</span>
            {getUnreadCount(feed.id) > 0 && (
              <span className="text-xs font-bold text-accent-feeds-unread-text flex-shrink-0 ml-2">
                {getUnreadCount(feed.id)}
              </span>
            )}
          </div>
        ))}

        {/* Folders with feeds */}
        {feedsByFolder.map(({ folder, feeds: folderFeeds }) => (
          <div key={folder.id} className="mb-2">
            <div
              className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${selectedFeedId === -folder.id
                ? 'bg-white/5 text-accent-link font-medium'
                : 'text-text-primary hover:bg-white/5 font-medium'
                }`}
            >
              <div className="flex items-center gap-1 flex-1 cursor-pointer" onClick={() => onFolderSelect?.(folder.id, folder.name)}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFolder(folder.id)
                  }}
                  className="text-text-secondary hover:text-accent-link transition-all"
                  aria-label={isFolderExpanded(folder.id) ? 'Collapse folder' : 'Expand folder'}
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${isFolderExpanded(folder.id) ? 'rotate-90' : ''
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="font-folder-name" style={{ fontSize: 'var(--font-size-folder-name)' }}>{toSnakeCase(folder.name)}</span>
              </div>
              {getFolderUnreadCount(folder.id) > 0 && (
                <span className="text-xs font-bold bg-accent-unread text-accent-unread-text px-2 py-0.5 rounded">
                  {getFolderUnreadCount(folder.id)}
                </span>
              )}
            </div>
            {isFolderExpanded(folder.id) && folderFeeds.map((feed) => (
              <div
                key={feed.id}
                className={`flex items-center justify-between px-6 py-1.5 rounded cursor-pointer transition-colors text-sm ${selectedFeedId === feed.id
                  ? 'bg-white/5 text-accent-link'
                  : 'text-text-primary hover:bg-white/5'
                  }`}
                onClick={() => onFeedSelect?.(feed.id, feed.title)}
              >
                <span className="truncate font-feed-name" style={{ fontSize: 'var(--font-size-feed-name)' }}>{toSnakeCase(feed.title)}</span>
                {getUnreadCount(feed.id) > 0 && (
                  <span className="text-xs text-accent-feeds-unread-text flex-shrink-0 ml-2">
                    {getUnreadCount(feed.id)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={refreshData}
      />
    </aside>
  )
}
