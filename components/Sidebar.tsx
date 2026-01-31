'use client'

import { useState, useEffect } from 'react'
import { useUnreadCounts } from '@/lib/context/UnreadCountsContext'
import SettingsModal from './SettingsModal'
import { toSnakeCase } from '@/lib/utils/textUtils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableFeedItem } from './sidebar/SortableFeedItem'
import { SortableFolderItem } from './sidebar/SortableFolderItem'

interface Feed {
  id: number
  title: string
  url: string
  folderId: number | null
  order: number
}

interface Folder {
  id: number
  name: string
  order: number
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchFeeds = () => {
    fetch('/api/feeds')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeeds(data)
        } else {
          console.error('Failed to fetch feeds: Response is not an array', data)
          setFeeds([])
        }
      })
      .catch(console.error)
  }

  const fetchFolders = () => {
    fetch('/api/folders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFolders(data)
        } else {
          console.error('Failed to fetch folders: Response is not an array', data)
          setFolders([])
        }
      })
      .catch(console.error)
  }

  const refreshData = () => {
    fetchFeeds()
    fetchFolders()
  }

  useEffect(() => {
    fetchFolders()
    fetchFeeds()

    try {
      const saved = localStorage.getItem('pirssonite_folder_state')
      if (saved) {
        setExpandedFolders(JSON.parse(saved))
      }

      const savedHideEmpty = localStorage.getItem('pirssonite_hide_empty_feeds')
      if (savedHideEmpty) {
        setHideEmptyFeeds(savedHideEmpty === 'true')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    // Handle Folder Sorting
    if (activeIdStr.startsWith('folder-') && overIdStr.startsWith('folder-')) {
      const oldIndex = folders.findIndex(f => `folder-${f.id}` === activeIdStr)
      const newIndex = folders.findIndex(f => `folder-${f.id}` === overIdStr)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFolders = arrayMove(folders, oldIndex, newIndex).map((f, i) => ({
          ...f,
          order: i
        }))

        setFolders(newFolders)

        // Persist
        fetch('/api/folders/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderIds: newFolders.map(f => f.id) })
        }).catch(console.error)
      }
      return
    }

    // Handle Feed Sorting
    if (activeIdStr.startsWith('feed-') && overIdStr.startsWith('feed-')) {
      // Find which list/container we are in
      // Since ids are global unique (feed-X), we need to find the feed objects
      const activeFeed = feeds.find(f => `feed-${f.id}` === activeIdStr)
      const overFeed = feeds.find(f => `feed-${f.id}` === overIdStr)

      if (!activeFeed || !overFeed) return

      // Ensure we only sort within same container (Root vs Root, or Folder A vs Folder A)
      if (activeFeed.folderId !== overFeed.folderId) {
        return // Dragging between folders not supported in this iteration
      }

      // Filter to get the relevant list (siblings)
      const siblings = feeds
        .filter(f => f.folderId === activeFeed.folderId)
        .sort((a, b) => (a.order || 0) - (b.order || 0)) // Ensure simplified sort matches visual

      const oldIndex = siblings.findIndex(f => f.id === activeFeed.id)
      const newIndex = siblings.findIndex(f => f.id === overFeed.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSiblings = arrayMove(siblings, oldIndex, newIndex)
        // Assign new order values based on their new index
        // We need to preserve the order relative to the *whole* list?
        // Actually, we can just re-assign contiguous order integers for this subset
        // starting from 0 (or keeping existing range?).
        // Simple approach: set order = index.

        const updates = newSiblings.map((f, i) => ({ ...f, order: i }))

        // Update main state
        setFeeds(prev => {
          const next = prev.map(f => {
            const updated = updates.find(u => u.id === f.id)
            return updated ? updated : f
          })
          // Re-sort entire list by order (optional but good for consistency?)
          // actually API returns by order. Frontend state order matters?
          // We assume frontend renders filtered lists sorted by order.
          return next
        })

        // Persist
        fetch('/api/feeds/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedIds: updates.map(f => f.id) })
        }).catch(console.error)
      }
    }
  }

  // Filter and Sort feeds for display
  // Root feeds
  let rootFeeds = feeds
    .filter((f) => f.folderId === null)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  // Folders sorted
  let sortedFolders = [...folders].sort((a, b) => (a.order || 0) - (b.order || 0))

  let feedsByFolder = sortedFolders.map((folder) => ({
    folder,
    feeds: feeds
      .filter((f) => f.folderId === folder.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
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
    <aside className="w-full bg-bg-primary border-r border-border-divider overflow-y-auto h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-primary px-4 pt-4 pb-10">
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
      <div className="mb-6 px-4">
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="px-4 pb-4">
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
          <SortableContext
            items={rootFeeds.map(f => `feed-${f.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {rootFeeds.map((feed) => (
              <SortableFeedItem
                key={feed.id}
                id={`feed-${feed.id}`}
                feed={feed}
                isSelected={selectedFeedId === feed.id}
                unreadCount={getUnreadCount(feed.id)}
                onSelect={(id, title) => onFeedSelect?.(id, title)}
              />
            ))}
          </SortableContext>

          {/* Folders with feeds */}
          <SortableContext
            items={feedsByFolder.map(f => `folder-${f.folder.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {feedsByFolder.map(({ folder, feeds: folderFeeds }) => (
              <SortableFolderItem
                key={folder.id}
                id={`folder-${folder.id}`}
                folder={folder}
                feeds={folderFeeds}
                isSelected={selectedFeedId === -folder.id}
                selectedFeedId={selectedFeedId}
                isExpanded={isFolderExpanded(folder.id)}
                unreadCount={getFolderUnreadCount(folder.id)}
                getFeedUnreadCount={getUnreadCount}
                onToggle={toggleFolder}
                onFolderSelect={(id, name) => onFolderSelect?.(id, name)}
                onFeedSelect={(id, title) => onFeedSelect?.(id, title)}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={refreshData}
      />
    </aside>
  )
}
