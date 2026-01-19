'use client'

import { useState, useEffect } from 'react'
import ManageFeedsModal from './ManageFeedsModal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export default function SettingsModal({ isOpen, onClose, onRefresh }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'feeds'>('appearance')
  const [articleWidth, setArticleWidth] = useState(700)
  const [hideEmptyFeeds, setHideEmptyFeeds] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem('pirssonite_card_max_width')
      if (savedWidth) {
        setArticleWidth(parseInt(savedWidth))
      }

      const savedHideEmpty = localStorage.getItem('pirssonite_hide_empty_feeds')
      if (savedHideEmpty) {
        setHideEmptyFeeds(savedHideEmpty === 'true')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }, [isOpen])

  // Save article width to localStorage
  const handleWidthChange = (value: number) => {
    setArticleWidth(value)
    try {
      localStorage.setItem('pirssonite_card_max_width', value.toString())
      // Dispatch event to notify EntryFeed of the change
      window.dispatchEvent(new Event('articleWidthChanged'))
    } catch (error) {
      console.error('Failed to save article width:', error)
    }
  }

  // Save hide empty feeds setting to localStorage
  const handleHideEmptyFeedsChange = (value: boolean) => {
    setHideEmptyFeeds(value)
    try {
      localStorage.setItem('pirssonite_hide_empty_feeds', value.toString())
      // Dispatch event to notify Sidebar of the change
      window.dispatchEvent(new Event('hideEmptyFeedsChanged'))
    } catch (error) {
      console.error('Failed to save hide empty feeds setting:', error)
    }
  }

  if (!isOpen) return null

  // If feeds tab is active, show the manage feeds modal
  if (activeTab === 'feeds') {
    return (
      <ManageFeedsModal
        isOpen={isOpen}
        onClose={onClose}
        onRefresh={onRefresh}
      />
    )
  }

  // Appearance settings tab
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-panel rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-soft">
          <h2 className="text-xl font-semibold text-text-primary">settings</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-soft">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'appearance'
                ? 'text-accent-cyan border-b-2 border-accent-cyan'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            appearance
          </button>
          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'feeds'
                ? 'text-accent-cyan border-b-2 border-accent-cyan'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            manage_feeds
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Article Width Setting */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                article_width: <span className="text-accent-cyan">{articleWidth}px</span>
              </label>
              <p className="text-xs text-text-muted mb-3">
                adjust the maximum width of article cards (400-1200px)
              </p>
              <input
                type="range"
                min="400"
                max="1200"
                step="50"
                value={articleWidth}
                onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                className="w-full h-2 bg-bg-accent rounded-lg appearance-none cursor-pointer accent-accent-cyan"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>400px (narrow)</span>
                <span>1200px (wide)</span>
              </div>
            </div>

            {/* Hide Empty Feeds Setting */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideEmptyFeeds}
                  onChange={(e) => handleHideEmptyFeedsChange(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-text-muted bg-bg-accent checked:bg-accent-cyan checked:border-accent-cyan cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    hide_empty_feeds
                  </span>
                  <p className="text-xs text-text-muted mt-1">
                    hide feeds and folders with no unread items from the sidebar
                  </p>
                </div>
              </label>
            </div>

            {/* Preview */}
            <div className="border border-border-soft rounded-lg p-4 bg-bg-card">
              <p className="text-xs text-text-muted mb-2">preview:</p>
              <div
                style={{ maxWidth: `${articleWidth}px` }}
                className="mx-auto bg-bg-accent rounded p-3 text-center text-sm text-text-secondary"
              >
                article cards will be centered at this width
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
