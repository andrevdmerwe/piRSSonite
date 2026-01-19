'use client'

import { useState, useEffect } from 'react'
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

interface ManageFeedsModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export default function ManageFeedsModal({ isOpen, onClose, onRefresh }: ManageFeedsModalProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Add Feed form state
  const [feedUrl, setFeedUrl] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [addingFeed, setAddingFeed] = useState(false)

  // Create Folder form state
  const [folderName, setFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  // Edit Folder state
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')

  // OPML Import state
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)

  // Fetch feeds and folders when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      const [feedsRes, foldersRes] = await Promise.all([
        fetch('/api/feeds'),
        fetch('/api/folders')
      ])

      if (feedsRes.ok && foldersRes.ok) {
        const feedsData = await feedsRes.json()
        const foldersData = await foldersRes.json()
        setFeeds(feedsData)
        setFolders(foldersData)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedUrl.trim()) {
      showError('please_enter_a_feed_url')
      return
    }

    setAddingFeed(true)
    setError(null)

    try {
      const response = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: feedUrl.trim(),
          folderId: selectedFolderId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || 'Failed to add feed')
        return
      }

      showSuccess(`added_feed: ${toSnakeCase(data.title)}`)
      setFeedUrl('')
      setSelectedFolderId(null)
      await fetchData()
      onRefresh()
    } catch (err) {
      showError('network_error_please_try_again')
    } finally {
      setAddingFeed(false)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folderName.trim()) {
      showError('please_enter_a_folder_name')
      return
    }

    setCreatingFolder(true)
    setError(null)

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || 'Failed to create folder')
        return
      }

      showSuccess(`created_folder: ${toSnakeCase(data.name)}`)
      setFolderName('')
      await fetchData()
      onRefresh()
    } catch (err) {
      showError('network_error_please_try_again')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleRenameFolder = async (folderId: number) => {
    if (!editingFolderName.trim()) {
      showError('folder_name_cannot_be_empty')
      return
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingFolderName.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || 'Failed to rename folder')
        return
      }

      showSuccess(`renamed_folder_to: ${toSnakeCase(data.name)}`)
      setEditingFolderId(null)
      setEditingFolderName('')
      await fetchData()
      onRefresh()
    } catch (err) {
      showError('network_error_please_try_again')
    }
  }

  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    const feedCount = feeds.filter(f => f.folderId === folderId).length
    const message = feedCount > 0
      ? `Delete '${folderName}'? Its ${feedCount} feed(s) will be moved to the root.`
      : `Delete '${folderName}'?`

    if (!confirm(message)) {
      return
    }

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        showError(data.error || 'Failed to delete folder')
        return
      }

      showSuccess(`deleted_folder: ${toSnakeCase(folderName)}`)
      await fetchData()
      onRefresh()
    } catch (err) {
      showError('network_error_please_try_again')
    }
  }

  const handleDeleteFeed = async (feedId: number, feedTitle: string) => {
    if (!confirm(`Delete '${feedTitle}'? All its articles will be removed.`)) {
      return
    }

    try {
      const response = await fetch(`/api/feeds/${feedId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        showError(data.error || 'Failed to delete feed')
        return
      }

      showSuccess(`deleted_feed: ${toSnakeCase(feedTitle)}`)
      await fetchData()
      onRefresh()
    } catch (err) {
      showError('network_error_please_try_again')
    }
  }

  const handleMoveFeed = async (feedId: number, newFolderId: number | null, feedTitle: string) => {
    try {
      const response = await fetch(`/api/feeds/${feedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: newFolderId })
      })

      if (!response.ok) {
        const data = await response.json()
        showError(data.error || 'Failed to move feed')
        return
      }

      const folderName = newFolderId
        ? folders.find(f => f.id === newFolderId)?.name || 'folder'
        : 'root'
      showSuccess(`moved: ${toSnakeCase(feedTitle)} to ${toSnakeCase(folderName)}`)
      await fetchData()
      onRefresh()
    } catch (err) {
      showError('network_error_please_try_again')
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/opml/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || 'Import failed')
        return
      }

      setImportResult(data)
      showSuccess(
        `imported: ${data.imported} feeds${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}`
      )

      // Refresh feed list
      await fetchData()
      onRefresh()
    } catch (err) {
      showError('network_error_during_import')
    } finally {
      setImporting(false)
      // Reset file input
      e.target.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-panel rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bg-panel border-b border-border-soft p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">manage_feeds</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
            aria-label="close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-900 bg-opacity-30 border border-green-700 rounded text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Import/Export Section */}
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-4">import_export_feeds</h3>
            <div className="bg-bg-card rounded-lg p-4">
              <div className="flex gap-2 mb-3">
                {/* Export Button */}
                <a
                  href="/api/opml/export"
                  download
                  className="flex-1 px-4 py-2 bg-accent-cyan text-bg-main rounded font-semibold hover:opacity-90 transition-opacity text-center"
                >
                  export_opml
                </a>

                {/* Import Button (hidden file input + label) */}
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept=".opml,.xml,application/xml,text/xml"
                    onChange={handleImportFile}
                    className="hidden"
                    disabled={importing}
                  />
                  <div className="px-4 py-2 bg-accent-cyan text-bg-main rounded font-semibold hover:opacity-90 transition-opacity text-center disabled:opacity-50">
                    {importing ? 'importing...' : 'import_opml'}
                  </div>
                </label>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className="p-3 bg-bg-main rounded text-sm">
                  <div className="text-text-primary">
                    ✓ imported: {importResult.imported} | skipped: {importResult.skipped}
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 text-red-400">
                      <div className="font-semibold">errors ({importResult.errors.length}):</div>
                      <ul className="list-disc ml-4 mt-1 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Add Feed Section */}
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-4">add_new_feed</h3>
            <div className="bg-bg-card rounded-lg p-4">
              <form onSubmit={handleAddFeed} className="space-y-4">
                <div>
                  <label htmlFor="feedUrl" className="block text-sm font-medium text-text-secondary mb-2">
                    feed_url
                  </label>
                  <input
                    type="url"
                    id="feedUrl"
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    placeholder="https://example.com/feed.rss"
                    className="w-full px-3 py-2 bg-bg-main border border-border-soft rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan"
                    disabled={addingFeed}
                  />
                </div>

                <div>
                  <label htmlFor="folderId" className="block text-sm font-medium text-text-secondary mb-2">
                    folder_optional
                  </label>
                  <select
                    id="folderId"
                    value={selectedFolderId || ''}
                    onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-bg-main border border-border-soft rounded text-text-primary focus:outline-none focus:border-accent-cyan"
                    disabled={addingFeed}
                  >
                    <option value="">no_folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {toSnakeCase(folder.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addingFeed}
                  className="w-full px-4 py-2 bg-accent-cyan text-bg-main rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingFeed ? 'adding...' : 'add_feed'}
                </button>
              </form>
            </div>
          </section>

          {/* Manage Folders Section */}
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-4">manage_folders</h3>
            <div className="bg-bg-card rounded-lg p-4">
              <form onSubmit={handleCreateFolder} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="new_folder_name"
                    className="flex-1 px-3 py-2 bg-bg-main border border-border-soft rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan"
                    disabled={creatingFolder}
                  />
                  <button
                    type="submit"
                    disabled={creatingFolder}
                    className="px-4 py-2 bg-accent-cyan text-bg-main rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingFolder ? 'creating...' : 'create_folder'}
                  </button>
                </div>
              </form>

              {folders.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">no_folders_yet</p>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-2 bg-bg-main rounded gap-2"
                    >
                      {editingFolderId === folder.id ? (
                        <>
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            className="flex-1 px-2 py-1 bg-bg-panel border border-border-soft rounded text-text-primary text-sm focus:outline-none focus:border-accent-cyan"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameFolder(folder.id)
                              }
                            }}
                          />
                          <button
                            onClick={() => handleRenameFolder(folder.id)}
                            className="px-2 py-1 bg-accent-cyan text-bg-main rounded text-xs font-semibold hover:opacity-90"
                          >
                            save
                          </button>
                          <button
                            onClick={() => {
                              setEditingFolderId(null)
                              setEditingFolderName('')
                            }}
                            className="px-2 py-1 bg-bg-accent text-text-secondary rounded text-xs hover:bg-opacity-80"
                          >
                            cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-text-primary">{toSnakeCase(folder.name)}</span>
                            <span className="text-text-muted text-sm">
                              {feeds.filter(f => f.folderId === folder.id).length} feeds
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingFolderId(folder.id)
                              setEditingFolderName(folder.name)
                            }}
                            className="px-2 py-1 text-text-secondary hover:text-text-primary text-xs"
                            title="Rename"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id, folder.name)}
                            className="px-2 py-1 text-text-secondary hover:text-red-400 text-xs"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Manage Feeds Section */}
          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-4">your_feeds</h3>
            <div className="bg-bg-card rounded-lg p-4">
              {feeds.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">no_feeds_yet_add_one_above</p>
              ) : (
                <div className="space-y-4">
                  {/* Feeds without folder */}
                  {feeds.filter(f => f.folderId === null).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-text-muted mb-2">no_folder</h4>
                      <div className="space-y-2">
                        {feeds.filter(f => f.folderId === null).map((feed) => (
                          <div
                            key={feed.id}
                            className="flex items-center justify-between p-2 bg-bg-main rounded gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-text-primary text-sm truncate">{feed.title}</div>
                              <div className="text-text-muted text-xs truncate">{feed.url}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={feed.folderId || ''}
                                onChange={(e) => handleMoveFeed(
                                  feed.id,
                                  e.target.value ? parseInt(e.target.value) : null,
                                  feed.title
                                )}
                                className="px-2 py-1 bg-bg-panel border border-border-soft rounded text-text-primary text-xs focus:outline-none focus:border-accent-cyan"
                              >
                                <option value="">no_folder</option>
                                {folders.map((folder) => (
                                  <option key={folder.id} value={folder.id}>
                                    {toSnakeCase(folder.name)}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDeleteFeed(feed.id, feed.title)}
                                className="px-2 py-1 text-text-secondary hover:text-red-400 text-xs"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feeds grouped by folder */}
                  {folders.map((folder) => {
                    const folderFeeds = feeds.filter(f => f.folderId === folder.id)
                    if (folderFeeds.length === 0) return null

                    return (
                      <div key={folder.id}>
                        <h4 className="text-sm font-medium text-text-muted mb-2">{toSnakeCase(folder.name)}</h4>
                        <div className="space-y-2">
                          {folderFeeds.map((feed) => (
                            <div
                              key={feed.id}
                              className="flex items-center justify-between p-2 bg-bg-main rounded gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-text-primary text-sm truncate">{feed.title}</div>
                                <div className="text-text-muted text-xs truncate">{feed.url}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={feed.folderId || ''}
                                  onChange={(e) => handleMoveFeed(
                                    feed.id,
                                    e.target.value ? parseInt(e.target.value) : null,
                                    feed.title
                                  )}
                                  className="px-2 py-1 bg-bg-panel border border-border-soft rounded text-text-primary text-xs focus:outline-none focus:border-accent-cyan"
                                >
                                  <option value="">no_folder</option>
                                  {folders.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {toSnakeCase(f.name)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleDeleteFeed(feed.id, feed.title)}
                                  className="px-2 py-1 text-text-secondary hover:text-red-400 text-xs"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
