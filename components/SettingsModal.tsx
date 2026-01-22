'use client'

import { useState, useEffect } from 'react'
import ManageFeedsModal from './ManageFeedsModal'
import { useTheme } from '@/lib/context/ThemeContext'
import { ThemeColors, FontOverrides } from '@/lib/themes/types'

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

// Font element labels
const fontElements: { key: keyof FontOverrides; label: string }[] = [
  { key: 'header', label: 'Header / Titles' },
  { key: 'folderName', label: 'Folder Names' },
  { key: 'feedName', label: 'Feed Names' },
  { key: 'articleHeading', label: 'Article Headings' },
  { key: 'articleBody', label: 'Article Body' },
  { key: 'badge', label: 'Badges' },
]

// Font options
const fontFamilyOptions = [
  { value: '', label: 'Default (Theme)' },
  { value: "'Courier New', 'Monaco', 'Menlo', monospace", label: 'Courier New' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
  { value: 'Menlo, monospace', label: 'Menlo' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
]

const fontSizeOptions = [
  { value: '', label: 'Default' },
  { value: '10px', label: '10px' },
  { value: '11px', label: '11px' },
  { value: '12px', label: '12px' },
  { value: '13px', label: '13px' },
  { value: '14px', label: '14px' },
  { value: '16px', label: '16px' },
  { value: '18px', label: '18px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' },
]

export default function SettingsModal({ isOpen, onClose, onRefresh }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'theme' | 'typography' | 'feeds'>('appearance')
  const [articleWidth, setArticleWidth] = useState(700)
  const [hideEmptyFeeds, setHideEmptyFeeds] = useState(false)
  const [showColorCustomization, setShowColorCustomization] = useState(false)
  const [customThemeName, setCustomThemeName] = useState('')
  const [showSaveTheme, setShowSaveTheme] = useState(false)

  const {
    theme,
    themeId,
    overrides,
    isLoading,
    setTheme,
    updateColorOverride,
    resetColorOverride,
    isColorOverridden,
    updateFontOverride,
    resetFontOverride,
    resetOverrides,
    availableThemes,
    customThemes,
    saveCustomTheme,
    deleteCustomTheme,
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
      setActiveTab('appearance')
      setShowSaveTheme(false)
      setCustomThemeName('')
    }
  }, [isOpen])

  const handleWidthChange = (value: number) => {
    setArticleWidth(value)
    try {
      localStorage.setItem('pirssonite_card_max_width', value.toString())
      window.dispatchEvent(new Event('articleWidthChanged'))
    } catch (error) {
      console.error('Failed to save article width:', error)
    }
  }

  const handleHideEmptyFeedsChange = (value: boolean) => {
    setHideEmptyFeeds(value)
    try {
      localStorage.setItem('pirssonite_hide_empty_feeds', value.toString())
      window.dispatchEvent(new Event('hideEmptyFeedsChanged'))
    } catch (error) {
      console.error('Failed to save hide empty feeds setting:', error)
    }
  }

  const handleSaveCustomTheme = () => {
    if (customThemeName.trim()) {
      saveCustomTheme(customThemeName.trim())
      setCustomThemeName('')
      setShowSaveTheme(false)
    }
  }

  if (!isOpen) return null

  if (activeTab === 'feeds') {
    return (
      <ManageFeedsModal
        isOpen={isOpen}
        onClose={() => setActiveTab('appearance')}
        onRefresh={onRefresh}
      />
    )
  }

  // Theme settings tab
  const renderThemeTab = () => {
    if (isLoading || !theme) {
      return (
        <div className="flex items-center justify-center h-32">
          <span className="text-text-secondary">loading_themes...</span>
        </div>
      )
    }

    const isCustomTheme = themeId.startsWith('custom-')
    const hasOverrides = Object.keys(overrides.colors || {}).length > 0 ||
      Object.keys(overrides.fonts || {}).length > 0

    return (
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">theme</label>
          <div className="flex gap-2">
            <select
              value={themeId}
              onChange={(e) => setTheme(e.target.value)}
              className="flex-1 px-3 py-2 bg-bg-primary border border-border-divider rounded-lg text-text-primary focus:border-accent-link focus:outline-none"
            >
              <optgroup label="Built-in Themes">
                {availableThemes.filter(t => !t.isCustom).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                ))}
              </optgroup>
              {customThemes.length > 0 && (
                <optgroup label="Custom Themes">
                  {availableThemes.filter(t => t.isCustom).map((t) => (
                    <option key={t.id} value={t.id}>★ {t.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {isCustomTheme && (
              <button
                onClick={() => deleteCustomTheme(themeId)}
                className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                title="Delete this custom theme"
              >
                🗑
              </button>
            )}
          </div>
        </div>

        {/* Save as Custom Theme */}
        <div className="border border-border-divider rounded-lg p-4 bg-bg-primary">
          {!showSaveTheme ? (
            <button
              onClick={() => setShowSaveTheme(true)}
              className="text-sm text-accent-link hover:text-accent-hover transition-colors"
              disabled={!hasOverrides && !isCustomTheme}
            >
              + save_as_custom_theme
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                placeholder="My Custom Theme"
                className="flex-1 px-3 py-2 bg-bg-primary border border-border-divider rounded-lg text-text-primary text-sm"
                autoFocus
              />
              <button
                onClick={handleSaveCustomTheme}
                disabled={!customThemeName.trim()}
                className="px-4 py-2 bg-accent-link text-bg-primary rounded-lg text-sm font-medium disabled:opacity-50"
              >
                save
              </button>
              <button
                onClick={() => { setShowSaveTheme(false); setCustomThemeName('') }}
                className="px-3 py-2 text-text-dimmed hover:text-text-primary"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Theme Preview Swatches */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">current_palette</label>
          <div className="grid grid-cols-6 gap-2">
            <div className="w-full aspect-square rounded" style={{ backgroundColor: theme.colors.background.primary }} title="background" />
            <div className="w-full aspect-square rounded" style={{ backgroundColor: theme.colors.background.card }} title="card" />
            <div className="w-full aspect-square rounded" style={{ backgroundColor: theme.colors.accent.link }} title="accent" />
            <div className="w-full aspect-square rounded" style={{ backgroundColor: theme.colors.accent.unreadBadge }} title="unread" />
            <div className="w-full aspect-square rounded" style={{ backgroundColor: theme.colors.accent.readBadge }} title="read" />
            <div className="w-full aspect-square rounded" style={{ backgroundColor: theme.colors.text.primary }} title="text" />
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

        {/* Color Customization Panel */}
        {showColorCustomization && (
          <div className="border border-border-divider rounded-lg p-4 bg-bg-primary space-y-4 max-h-80 overflow-y-auto">
            {(Object.keys(colorGroups) as (keyof typeof colorGroups)[]).map((group) => (
              <div key={group}>
                <h5 className="text-xs font-semibold text-text-secondary uppercase mb-2">{group}</h5>
                <div className="space-y-2">
                  {Object.entries(colorGroups[group]).map(([key, label]) => {
                    const colorValue = (theme.colors[group] as Record<string, string>)[key]
                    const isOverridden = isColorOverridden(group as keyof ThemeColors, key)
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colorValue?.startsWith('rgba') ? '#888888' : colorValue || '#888888'}
                          onChange={(e) => updateColorOverride(group as keyof ThemeColors, key, e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className={`text-xs flex-1 ${isOverridden ? 'text-accent-link font-medium' : 'text-text-secondary'}`}>
                          {label}
                        </span>
                        <input
                          type="text"
                          value={colorValue || ''}
                          onChange={(e) => updateColorOverride(group as keyof ThemeColors, key, e.target.value)}
                          className="w-28 px-2 py-1 text-xs bg-white/5 border border-border-divider rounded text-text-primary font-mono"
                        />
                        {isOverridden && (
                          <button
                            onClick={() => resetColorOverride(group as keyof ThemeColors, key)}
                            className="text-text-dimmed hover:text-accent-link transition-colors text-sm"
                            title="Reset to default"
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Watermark Settings */}
        <div className="border border-border-divider rounded-lg p-4 bg-bg-primary space-y-4">
          <h4 className="text-sm font-medium text-text-primary">watermark</h4>
          <div className="flex items-center justify-between">
            <label className="text-sm text-text-secondary">enable_watermark</label>
            <button
              onClick={() => setWatermarkEnabled(!watermarkEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${watermarkEnabled ? 'bg-accent-link' : 'bg-white/10'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${watermarkEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {watermarkEnabled && (
            <div className="flex items-center gap-3">
              <input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm text-text-secondary">watermark_color</span>
              <input type="text" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="flex-1 px-2 py-1 bg-bg-primary border border-border-divider rounded text-text-primary text-sm font-mono" />
            </div>
          )}
        </div>

        {/* Reset Button */}
        {hasOverrides && (
          <button onClick={resetOverrides} className="px-4 py-2 text-sm bg-white/10 text-text-secondary hover:text-text-primary hover:bg-white/20 rounded-lg transition-colors">
            reset_all_overrides
          </button>
        )}
      </div>
    )
  }

  // Typography settings tab
  const renderTypographyTab = () => {
    if (isLoading || !theme) {
      return <div className="flex items-center justify-center h-32"><span className="text-text-secondary">loading...</span></div>
    }

    return (
      <div className="space-y-6">
        <p className="text-sm text-text-dimmed">Customize fonts for individual UI elements. Changes are saved automatically.</p>

        {fontElements.map(({ key, label }) => {
          const currentFont = overrides.fonts?.[key]
          const hasOverride = currentFont?.family || currentFont?.size
          return (
            <div key={key} className="border border-border-divider rounded-lg p-4 bg-bg-primary">
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-sm font-medium ${hasOverride ? 'text-accent-link' : 'text-text-primary'}`}>{label}</h4>
                {hasOverride && (
                  <button onClick={() => resetFontOverride(key)} className="text-text-dimmed hover:text-accent-link transition-colors text-sm" title="Reset to default">
                    ↺ reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-dimmed mb-1">font_family</label>
                  <select
                    value={currentFont?.family || ''}
                    onChange={(e) => updateFontOverride(key, { family: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 bg-bg-primary border border-border-divider rounded text-text-primary text-sm"
                  >
                    {fontFamilyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-dimmed mb-1">font_size</label>
                  <select
                    value={currentFont?.size || ''}
                    onChange={(e) => updateFontOverride(key, { size: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 bg-bg-primary border border-border-divider rounded text-text-primary text-sm"
                  >
                    {fontSizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Appearance settings tab
  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">article_width: <span className="text-accent-link">{articleWidth}px</span></label>
        <p className="text-xs text-text-dimmed mb-3">adjust the maximum width of article cards (400-1200px)</p>
        <input type="range" min="400" max="1200" step="50" value={articleWidth} onChange={(e) => handleWidthChange(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-link" />
        <div className="flex justify-between text-xs text-text-dimmed mt-1"><span>400px</span><span>1200px</span></div>
      </div>
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={hideEmptyFeeds} onChange={(e) => handleHideEmptyFeedsChange(e.target.checked)} className="w-4 h-4 rounded border-2 border-text-dimmed bg-white/10 checked:bg-accent-link checked:border-accent-link cursor-pointer" />
          <div>
            <span className="text-sm font-medium text-text-primary">hide_empty_feeds</span>
            <p className="text-xs text-text-dimmed mt-1">hide feeds with no unread items</p>
          </div>
        </label>
      </div>
      <div className="border border-border-divider rounded-lg p-4 bg-bg-primary">
        <p className="text-xs text-text-dimmed mb-2">preview:</p>
        <div style={{ maxWidth: `${articleWidth}px` }} className="mx-auto bg-white/5 rounded p-3 text-center text-sm text-text-secondary">
          article cards will be centered at this width
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border-divider">
        <div className="flex items-center justify-between p-4 border-b border-border-divider">
          <h2 className="text-xl font-semibold text-text-primary">settings</h2>
          <button onClick={onClose} className="text-text-dimmed hover:text-text-primary transition-colors" aria-label="Close">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex border-b border-border-divider">
          {(['appearance', 'theme', 'typography', 'feeds'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-accent-link border-b-2 border-accent-link' : 'text-text-dimmed hover:text-text-secondary'}`}
            >
              {tab === 'feeds' ? 'manage_feeds' : tab}
            </button>
          ))}
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'appearance' && renderAppearanceTab()}
          {activeTab === 'theme' && renderThemeTab()}
          {activeTab === 'typography' && renderTypographyTab()}
        </div>
      </div>
    </div>
  )
}
