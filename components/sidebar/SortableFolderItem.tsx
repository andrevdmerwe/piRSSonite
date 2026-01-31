'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toSnakeCase } from '@/lib/utils/textUtils'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableFeedItem } from './SortableFeedItem'

interface Folder {
    id: number
    name: string
}

interface Feed {
    id: number
    title: string
    url: string
    folderId: number | null
}

interface SortableFolderItemProps {
    id: string
    folder: Folder
    feeds: Feed[]
    isSelected: boolean // For folder selection
    selectedFeedId: number | undefined
    isExpanded: boolean
    unreadCount: number
    getFeedUnreadCount: (id: number) => number
    onToggle: (id: number) => void
    onFolderSelect: (id: number, name: string) => void
    onFeedSelect: (id: number, title: string) => void
}

export function SortableFolderItem({
    id,
    folder,
    feeds,
    isSelected,
    selectedFeedId,
    isExpanded,
    unreadCount,
    getFeedUnreadCount,
    onToggle,
    onFolderSelect,
    onFeedSelect,
}: SortableFolderItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto', // High zIndex for visibility
        position: 'relative' as const,
    }

    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            {/* Folder Header */}
            <div
                className={`group flex items-center justify-between px-3 py-2 rounded transition-colors ${isSelected
                    ? 'bg-white/5 text-accent-link font-medium'
                    : 'text-text-primary hover:bg-white/5 font-medium'
                    }`}
            >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    {/* Drag Handle - Visible on hover */}
                    <div
                        className="opacity-0 group-hover:opacity-50 cursor-grab hover:opacity-100 p-0.5 mr-1"
                        {...listeners}
                        {...attributes}
                    >
                        <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
                            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                        </svg>
                    </div>

                    <div
                        className="flex items-center gap-1 flex-1 cursor-pointer min-w-0"
                        onClick={() => onFolderSelect(folder.id, folder.name)}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggle(folder.id)
                            }}
                            className="text-text-secondary hover:text-accent-link transition-all flex-shrink-0"
                            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                        >
                            <svg
                                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <span className="font-folder-name truncate" style={{ fontSize: 'var(--font-size-folder-name)' }}>
                            {toSnakeCase(folder.name)}
                        </span>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <span className="text-xs font-bold bg-accent-unread text-accent-unread-text px-2 py-0.5 rounded ml-2 flex-shrink-0">
                        {unreadCount}
                    </span>
                )}
            </div>

            {/* Nested Feeds */}
            {isExpanded && (
                <div className="pl-4">
                    <SortableContext
                        items={feeds.map(f => `feed-${f.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        {feeds.map((feed) => (
                            <SortableFeedItem
                                key={feed.id}
                                id={`feed-${feed.id}`}
                                feed={feed}
                                isSelected={selectedFeedId === feed.id}
                                unreadCount={getFeedUnreadCount(feed.id)}
                                onSelect={onFeedSelect}
                            />
                        ))}
                    </SortableContext>
                </div>
            )}
        </div>
    )
}
