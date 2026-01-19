'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import EntryFeed from '@/components/EntryFeed'

export default function Home() {
  // selectedFeedId encoding:
  // - undefined (or 0): all items
  // - positive: specific feed
  // - negative: folder (absolute value is folderId)
  const [selectedFeedId, setSelectedFeedId] = useState<number | undefined>(undefined)

  // Convert to feedId/folderId for EntryFeed
  const feedId = selectedFeedId !== undefined && selectedFeedId > 0 ? selectedFeedId : undefined
  const folderId = selectedFeedId !== undefined && selectedFeedId < 0 ? Math.abs(selectedFeedId) : undefined

  return (
    <main className="flex h-screen overflow-hidden">
      <Sidebar
        onFeedSelect={(feedId) => setSelectedFeedId(feedId === 0 ? undefined : feedId)}
        onFolderSelect={(folderId) => setSelectedFeedId(-folderId)}
        selectedFeedId={selectedFeedId}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <EntryFeed feedId={feedId} folderId={folderId} />
      </div>
    </main>
  )
}
