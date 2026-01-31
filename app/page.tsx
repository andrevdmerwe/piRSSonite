'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import EntryFeed from '@/components/EntryFeed'

export default function Home() {
  // selectedFeedId encoding:
  // - undefined (or 0): all items
  // - positive: specific feed
  // - negative: folder (absolute value is folderId)
  const [selectedFeedId, setSelectedFeedId] = useState<number | undefined>(undefined)
  const [selectedName, setSelectedName] = useState<string>('all_items')
  const [sidebarWidth, setSidebarWidth] = useState(288)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(288)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Load sidebar width from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pirssonite_sidebar_width')
      if (saved) {
        const width = parseInt(saved)
        setSidebarWidth(width)
        startWidthRef.current = width
      }
    } catch (error) {
      console.error('Failed to load sidebar width:', error)
    }
  }, [])

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = sidebarWidth
  }

  // Handle resize move and end
  useEffect(() => {
    if (!isResizing) return

    // Prevent text selection during drag
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      const newWidth = startWidthRef.current + delta

      // Apply constraints: min 200px, max 500px
      const constrainedWidth = Math.min(Math.max(newWidth, 200), 500)
      setSidebarWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      // Restore cursor and text selection
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // Save to localStorage
      try {
        localStorage.setItem('pirssonite_sidebar_width', sidebarWidth.toString())
      } catch (error) {
        console.error('Failed to save sidebar width:', error)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, sidebarWidth])

  // Convert to feedId/folderId for EntryFeed
  const feedId = selectedFeedId !== undefined && selectedFeedId > 0 ? selectedFeedId : undefined
  const folderId = selectedFeedId !== undefined && selectedFeedId < 0 ? Math.abs(selectedFeedId) : undefined

  return (
    <main className="flex h-screen overflow-hidden">
      <div className="relative" style={{ width: `${sidebarWidth}px` }}>
        <Sidebar
          onFeedSelect={(feedId, feedTitle) => {
            setSelectedFeedId(feedId === 0 ? undefined : feedId)
            setSelectedName(feedTitle || 'all_items')
          }}
          onFolderSelect={(folderId, folderName) => {
            setSelectedFeedId(-folderId)
            setSelectedName(folderName || 'folder')
          }}
          selectedFeedId={selectedFeedId}
        />
        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent-border transition-colors ${isResizing ? 'bg-accent-cyan' : ''
            }`}
          style={{ userSelect: 'none' }}
        />
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <EntryFeed feedId={feedId} folderId={folderId} selectedName={selectedName} sidebarWidth={sidebarWidth} scrollContainerRef={scrollContainerRef} />
      </div>
    </main>
  )
}
