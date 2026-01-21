'use client'

import { useState, useEffect } from 'react'
import ManageFeedsModal from './ManageFeedsModal'
import { useTheme } from '@/lib/context/ThemeContext'
import { ThemeColors } from '@/lib/themes/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

// Human-readable labels for color tokens (grouped by category)
const colorGroups = {
  background: {
    primary: 'app_background',
    secondary: 'sidebar_background',
    card: 'card_background',
    cardHover: 'card_hover',
  },
  accent: {
    unreadBadge: 'unread_badge',
    unreadBadgeText: 'unread_badge_text',
    readBadge: 'read_badge',
    link: 'link_color',
    hoverAccent: 'hover_accent',
    feedsUnreadText: 'feeds_unread_text',
  },
  text: {
    primary: 'text_primary',
    secondary: 'text_secondary',
    dimmed: 'text_dimmed',
    status: 'text_status',
  },
  border: {
    card: 'border_card',
    cardHover: 'border_hover',
    divider: 'border_divider',
  },
}

// Font options
const fontOptions = [
  { value: "'Courier New', 'Monaco', 'Menlo', monospace", label: 'Courier New' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: 'Menlo, monospace', label: 'Menlo' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
]

export default function SettingsModal({ isOpen, onClose, onRefresh }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'theme' | 'feeds'>('appearance')
  const [articleWidth, setArticleWidth] = useState(700)
  const [hideEmptyFeeds, setHideEmptyFeeds] = useState(false)
  const [showColorCustomization, setShowColorCustomization] = useState(false)

  const {
    theme,
    themeId,
    overrides,
    isLoading,
    setTheme,
    updateColorOverride,
    resetOverrides,
    availableThemes,
    watermarkEnabled,
    watermarkColor,
    setWatermarkEnabled,
    setWatermarkColor,
  } = useTheme()

  // Manage modal state and settings loading
  useEffect(() => {
    if (isOpen) {
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
    } else {
      // Reset to default tab when closed
      setActiveTab('appearance')
    }
  }, [isOpen])

  // Save article width to localStorage
  const handleWidthChange = (value: number) => {
    setArticleWidth(value)
    try {
      localStorage.setItem('pirssonite_card_max_width', value.toString())
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
        onClose={() => setActiveTab('appearance')} // Navigate back to settings
        onRefresh={onRefresh}
      />
    )
  }

  // Theme settings tab
  const renderThemeTab = () => {
    // Show loading state if theme is not ready
    if (isLoading || !theme) {
      return (
        <div className="flex items-center justify-center h-32">
          <span className="text-text-secondary">loading_themes...</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            theme
          </label>
          <select
            value={themeId}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-3 py-2 bg-bg-card border border-border-divider rounded-lg text-text-primary focus:border-accent-link focus:outline-none"
          >
            {availableThemes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.type})
              </option>
            ))}
          </select>
          <p className="text-xs text-text-dimmed mt-2">
            select a predefined theme to apply instantly
          </p>
        </div>

        {/* Theme Preview Swatches */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            current_palette
          </label>
          <div className="grid grid-cols-6 gap-2">
            <div
              className="w-full aspect-square rounded"
              style={{ backgroundColor: theme.colors.background.primary }}
              title="background"
            />
            <div
              className="w-full aspect-square rounded"
              style={{ backgroundColor: theme.colors.background.card }}
              title="card"
            />
            <div
              className="w-full aspect-square rounded"
              style={{ backgroundColor: theme.colors.accent.link }}
              title="accent"
            />
            <div
              className="w-full aspect-square rounded"
              style={{ backgroundColor: theme.colors.accent.unreadBadge }}
              title="unread"
            />
            <div
              className="w-full aspect-square rounded"
              style={{ backgroundColor: theme.colors.accent.readBadge }}
              title="read"
            />
            <div
              className="w-full aspect-square rounded"
              style={{ backgroundColor: theme.colors.text.primary }}
              title="text"
            />
          </div>
        </div>

        {/* Color Customization Toggle */}
        <div>
          <button
            onClick={() => setShowColorCustomization(!showColorCustomization)}
            className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-accent-link transition-colors"
          >
            <span>{showColorCustomization ? '▼' : '▶'}</span>
            <span>customize_colors</span>
          </button>
        </div>

        {/* Watermark Settings */}
        <div className="border border-border-divider rounded-lg p-4 bg-bg-card space-y-4">
          <h4 className="text-sm font-medium text-text-primary">watermark</h4>

          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary">enable_watermark</label>
            <button
              onClick={() => setWatermarkEnabled(!watermarkEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${watermarkEnabled ? 'bg-accent-link' : 'bg-white/10'
                }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${watermarkEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>

          {watermarkEnabled && (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={watermarkColor}
                onChange={(e) => setWatermarkColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-sm text-text-secondary">watermark_color</span>
              <input
                type="text"
                value={watermarkColor}
                onChange={(e) => setWatermarkColor(e.target.value)}
                className="flex-1 px-2 py-1 bg-bg-primary border border-border-divider rounded text-text-primary text-sm font-mono"
              />
            </div>
          )}
        </div>

        {/* Color Customization Panel */}
        {showColorCustomization && (
          <div className="border border-border-divider rounded-lg p-4 bg-bg-card space-y-4 max-h-64 overflow-y-auto">
            {(Object.keys(colorGroups) as (keyof typeof colorGroups)[]).map((group) => (
              <div key={group}>
                <h5 className="text-xs font-semibold text-text-secondary uppercase mb-2">{group}</h5>
                <div className="space-y-2">
                  {Object.entries(colorGroups[group]).map(([key, label]) => {
                    const colorValue = (theme.colors[group] as Record<string, string>)[key]
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colorValue?.startsWith('rgba') ? '#888888' : colorValue || '#888888'}
                          onChange={(e) => updateColorOverride(group as keyof ThemeColors, key, e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-xs text-text-secondary flex-1">{label}</span>
                        <input
                          type="text"
                          value={colorValue || ''}
                          onChange={(e) => updateColorOverride(group as keyof ThemeColors, key, e.target.value)}
                          className="w-32 px-2 py-1 text-xs bg-white/5 border border-border-divider rounded text-text-primary font-mono"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reset Button */}
        {Object.keys(overrides.colors || {}).length > 0 && (
          <button
            onClick={resetOverrides}
            className="px-4 py-2 text-sm bg-white/10 text-text-secondary hover:text-text-primary hover:bg-white/20 rounded-lg transition-colors"
          >
            reset_to_defaults
          </button>
        )}
      </div>
    )
  }

  // Appearance settings tab (article width, hide empty)
  const renderAppearanceTab = () => (
    <div className="space-y-6">
      {/* Article Width Setting */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          article_width: <span className="text-accent-link">{articleWidth}px</span>
        </label>
        <p className="text-xs text-text-dimmed mb-3">
          adjust the maximum width of article cards (400-1200px)
        </p>
        <input
          type="range"
          min="400"
          max="1200"
          step="50"
          value={articleWidth}
          onChange={(e) => handleWidthChange(parseInt(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-link"
        />
        <div className="flex justify-between text-xs text-text-dimmed mt-1">
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
            className="w-4 h-4 rounded border-2 border-text-dimmed bg-white/10 checked:bg-accent-link checked:border-accent-link cursor-pointer"
          />
          <div>
            <span className="text-sm font-medium text-text-primary">
              hide_empty_feeds
            </span>
            <p className="text-xs text-text-dimmed mt-1">
              hide feeds and folders with no unread items from the sidebar
            </p>
          </div>
        </label>
      </div>

      {/* Preview */}
      <div className="border border-border-divider rounded-lg p-4 bg-bg-card">
        <p className="text-xs text-text-dimmed mb-2">preview:</p>
        <div
          style={{ maxWidth: `${articleWidth}px` }}
          className="mx-auto bg-white/5 rounded p-3 text-center text-sm text-text-secondary"
        >
          article cards will be centered at this width
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border-divider">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-divider">
          <h2 className="text-xl font-semibold text-text-primary">settings</h2>
          <button
            onClick={onClose}
            className="text-text-dimmed hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-divider">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'appearance'
              ? 'text-accent-link border-b-2 border-accent-link'
              : 'text-text-dimmed hover:text-text-secondary'
              }`}
          >
            appearance
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'theme'
              ? 'text-accent-link border-b-2 border-accent-link'
              : 'text-text-dimmed hover:text-text-secondary'
              }`}
          >
            theme
          </button>
          <button
            onClick={() => setActiveTab('feeds')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'feeds'
              ? 'text-accent-link border-b-2 border-accent-link'
              : 'text-text-dimmed hover:text-text-secondary'
              }`}
          >
            manage_feeds
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'appearance' && renderAppearanceTab()}
          {activeTab === 'theme' && renderThemeTab()}
        </div>
      </div>
    </div>
  )
}
