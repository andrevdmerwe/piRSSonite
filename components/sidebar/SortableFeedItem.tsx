'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toSnakeCase } from '@/lib/utils/textUtils'

interface SortableFeedItemProps {
    id: string
    feed: {
        id: number
        title: string
        folderId: number | null
    }
    isSelected: boolean
    unreadCount: number
    onSelect: (id: number, title: string) => void
}

export function SortableFeedItem({ id, feed, isSelected, unreadCount, onSelect }: SortableFeedItemProps) {
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
        zIndex: isDragging ? 100 : 'auto',
        position: 'relative' as const,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${isSelected
                    ? 'bg-white/5 text-accent-link'
                    : 'text-text-primary hover:bg-white/5'
                }`}
            onClick={() => onSelect(feed.id, feed.title)}
            {...attributes}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Drag Handle - Visible on hover */}
                <div
                    className="opacity-0 group-hover:opacity-50 cursor-grab hover:opacity-100 p-0.5"
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                </div>

                <span className="truncate flex-1 font-feed-name" style={{ fontSize: 'var(--font-size-feed-name)' }}>
                    {toSnakeCase(feed.title)}
                </span>
            </div>

            {unreadCount > 0 && (
                <span className="text-xs font-bold text-accent-feeds-unread-text flex-shrink-0 ml-2">
                    {unreadCount}
                </span>
            )}
        </div>
    )
}
