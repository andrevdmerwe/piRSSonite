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
  onFeedSelect?: (feedId: number) => void
  onFolderSelect?: (folderId: number) => void
  selectedFeedId?: number
}

export default function Sidebar({ onFeedSelect, onFolderSelect, selectedFeedId }: SidebarProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
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
  }, [])

  const getUnreadCount = (feedId: number) => {
    return counts?.byFeed[feedId] || 0
  }

  const getFolderUnreadCount = (folderId: number) => {
    return counts?.byFolder[folderId] || 0
  }

  const rootFeeds = feeds.filter((f) => f.folderId === null)
  const feedsByFolder = folders.map((folder) => ({
    folder,
    feeds: feeds.filter((f) => f.folderId === folder.id),
  }))

  return (
    <aside className="w-72 bg-bg-panel border-r border-border-soft p-4 overflow-y-auto h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-xl font-bold text-accent-cyan">piRSSonite</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-text-secondary hover:text-accent-cyan transition-colors p-1"
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
          <div className="text-xs text-text-muted">
            {counts.total} unread_articles
          </div>
        )}
      </div>

      {/* Views */}
      <div className="mb-6">
        <h4 className="text-xs uppercase tracking-wider text-text-muted mb-2">
          views
        </h4>
        <div
          className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
            selectedFeedId === 0 || selectedFeedId === undefined
              ? 'bg-bg-accent text-accent-cyan'
              : 'text-text-secondary hover:bg-bg-accent'
          }`}
          onClick={() => onFeedSelect?.(0)}
        >
          <span>all_items</span>
          {counts && counts.total > 0 && (
            <span className="text-xs text-text-muted">
              {counts.total}
            </span>
          )}
        </div>
      </div>

      {/* Folders and Feeds */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-text-muted mb-2">
          feeds
        </h4>

        {/* Feeds without folders */}
        {rootFeeds.map((feed) => (
          <div
            key={feed.id}
            className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
              selectedFeedId === feed.id
                ? 'bg-bg-accent text-accent-cyan'
                : 'text-text-secondary hover:bg-bg-accent'
            }`}
            onClick={() => onFeedSelect?.(feed.id)}
          >
            <span className="truncate">{toSnakeCase(feed.title)}</span>
            {getUnreadCount(feed.id) > 0 && (
              <span className="text-xs text-text-muted flex-shrink-0 ml-2">
                {getUnreadCount(feed.id)}
              </span>
            )}
          </div>
        ))}

        {/* Folders with feeds */}
        {feedsByFolder.map(({ folder, feeds: folderFeeds }) => (
          <div key={folder.id} className="mb-2">
            <div
              className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                selectedFeedId === -folder.id
                  ? 'bg-bg-accent text-accent-cyan font-medium'
                  : 'text-text-secondary hover:bg-bg-accent font-medium'
              }`}
              onClick={() => onFolderSelect?.(folder.id)}
            >
              <span>{toSnakeCase(folder.name)}</span>
              {getFolderUnreadCount(folder.id) > 0 && (
                <span className="text-xs text-text-muted">
                  {getFolderUnreadCount(folder.id)}
                </span>
              )}
            </div>
            {folderFeeds.map((feed) => (
              <div
                key={feed.id}
                className={`flex items-center justify-between px-6 py-1.5 rounded cursor-pointer transition-colors text-sm ${
                  selectedFeedId === feed.id
                    ? 'bg-bg-accent text-accent-cyan'
                    : 'text-text-secondary hover:bg-bg-accent'
                }`}
                onClick={() => onFeedSelect?.(feed.id)}
              >
                <span className="truncate">{toSnakeCase(feed.title)}</span>
                {getUnreadCount(feed.id) > 0 && (
                  <span className="text-xs text-text-muted flex-shrink-0 ml-2">
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
