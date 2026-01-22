'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { Theme, ThemeColors, ThemeOverrides, ThemeState, ThemeListItem, CustomTheme, FontOverrides } from '../themes/types'
import { loadTheme, loadAllThemes, DEFAULT_THEME_ID, AVAILABLE_THEMES, isValidThemeId } from '../themes/loader'

interface ThemeContextType {
    // Current theme (with overrides applied)
    theme: Theme | null
    // Active theme ID
    themeId: string
    // User overrides
    overrides: ThemeOverrides
    // Watermark settings
    watermarkEnabled: boolean
    watermarkColor: string
    // Loading state
    isLoading: boolean
    // Switch to a different theme
    setTheme: (id: string) => void
    // Update a color override (nested path like 'background.primary')
    updateColorOverride: (group: keyof ThemeColors, key: string, value: string) => void
    // Reset a single color override
    resetColorOverride: (group: keyof ThemeColors, key: string) => void
    // Update typography override
    updateTypographyOverride: (key: string, value: string) => void
    // Update font override for a specific element
    updateFontOverride: (element: keyof FontOverrides, font: { family?: string; size?: string }) => void
    // Reset font override for a specific element
    resetFontOverride: (element: keyof FontOverrides) => void
    // Reset all overrides for current theme
    resetOverrides: () => void
    // Check if a color is overridden
    isColorOverridden: (group: keyof ThemeColors, key: string) => boolean
    // Get list of all available themes
    availableThemes: ThemeListItem[]
    // Custom themes
    customThemes: CustomTheme[]
    // Save current overrides as a custom theme
    saveCustomTheme: (name: string) => void
    // Delete a custom theme
    deleteCustomTheme: (id: string) => void
    // Watermark controls
    setWatermarkEnabled: (enabled: boolean) => void
    setWatermarkColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'pirssonite_theme_state'
const WATERMARK_STORAGE_KEY = 'pirssonite_watermark'
const CUSTOM_THEMES_KEY = 'pirssonite_custom_themes'

// Load theme state from localStorage
function loadThemeState(): ThemeState {
    if (typeof window === 'undefined') {
        return { activeThemeId: DEFAULT_THEME_ID, overrides: {} }
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            // Check if it's a valid built-in theme or custom theme
            if (isValidThemeId(parsed.activeThemeId) || parsed.activeThemeId.startsWith('custom-')) {
                return parsed
            }
        }
    } catch (error) {
        console.error('Failed to load theme state:', error)
    }

    return { activeThemeId: DEFAULT_THEME_ID, overrides: {} }
}

// Load custom themes from localStorage
function loadCustomThemes(): CustomTheme[] {
    if (typeof window === 'undefined') return []

    try {
        const saved = localStorage.getItem(CUSTOM_THEMES_KEY)
        if (saved) {
            return JSON.parse(saved)
        }
    } catch (error) {
        console.error('Failed to load custom themes:', error)
    }
    return []
}

// Save custom themes to localStorage
function saveCustomThemes(themes: CustomTheme[]): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes))
    } catch (error) {
        console.error('Failed to save custom themes:', error)
    }
}

// Save theme state to localStorage
function saveThemeState(state: ThemeState): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
        console.error('Failed to save theme state:', error)
    }
}

// Apply theme to CSS variables
function applyThemeToCss(theme: Theme, fontOverrides?: FontOverrides): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Apply background colors
    root.style.setProperty('--color-bg-primary', theme.colors.background.primary)
    root.style.setProperty('--color-bg-secondary', theme.colors.background.secondary)
    root.style.setProperty('--color-bg-card', theme.colors.background.card)
    root.style.setProperty('--color-bg-card-hover', theme.colors.background.cardHover)

    // Apply accent colors
    root.style.setProperty('--color-accent-unread', theme.colors.accent.unreadBadge)
    root.style.setProperty('--color-accent-unread-text', theme.colors.accent.unreadBadgeText)
    root.style.setProperty('--color-accent-read', theme.colors.accent.readBadge)
    root.style.setProperty('--color-accent-link', theme.colors.accent.link)
    root.style.setProperty('--color-accent-hover', theme.colors.accent.hoverAccent)
    root.style.setProperty('--color-accent-feeds-unread-text', theme.colors.accent.feedsUnreadText)

    // Apply text colors
    root.style.setProperty('--color-text-primary', theme.colors.text.primary)
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
    root.style.setProperty('--color-text-dimmed', theme.colors.text.dimmed)
    root.style.setProperty('--color-text-status', theme.colors.text.status)

    // Apply border colors
    root.style.setProperty('--color-border-card', theme.colors.border.card)
    root.style.setProperty('--color-border-card-hover', theme.colors.border.cardHover)
    root.style.setProperty('--color-border-divider', theme.colors.border.divider)

    // Apply base typography
    root.style.setProperty('--font-family-mono', theme.typography.fontFamily)
    root.style.setProperty('--font-size-xs', theme.typography.sizes.sectionHeader)
    root.style.setProperty('--font-size-sm', theme.typography.sizes.metadata)
    root.style.setProperty('--font-size-base', theme.typography.sizes.feedItem)
    root.style.setProperty('--font-size-lg', theme.typography.sizes.articleSubtitle)
    root.style.setProperty('--font-size-xl', theme.typography.sizes.articleTitle)
    root.style.setProperty('--font-weight-regular', String(theme.typography.weights.regular))
    root.style.setProperty('--font-weight-semibold', String(theme.typography.weights.semibold))
    root.style.setProperty('--font-weight-bold', String(theme.typography.weights.bold))
    root.style.setProperty('--line-height-compact', String(theme.typography.lineHeights.compact))
    root.style.setProperty('--line-height-normal', String(theme.typography.lineHeights.normal))
    root.style.setProperty('--line-height-relaxed', String(theme.typography.lineHeights.relaxed))

    // Apply per-element font overrides
    const defaultFont = theme.typography.fontFamily
    const defaultSizes = {
        folderName: '13px',
        feedName: '13px',
        articleHeading: '16px',
        articleBody: '13px',
        header: '20px',
        badge: '11px',
    }

    root.style.setProperty('--font-folder-name', fontOverrides?.folderName?.family || defaultFont)
    root.style.setProperty('--font-size-folder-name', fontOverrides?.folderName?.size || defaultSizes.folderName)
    root.style.setProperty('--font-feed-name', fontOverrides?.feedName?.family || defaultFont)
    root.style.setProperty('--font-size-feed-name', fontOverrides?.feedName?.size || defaultSizes.feedName)
    root.style.setProperty('--font-article-heading', fontOverrides?.articleHeading?.family || defaultFont)
    root.style.setProperty('--font-size-article-heading', fontOverrides?.articleHeading?.size || defaultSizes.articleHeading)
    root.style.setProperty('--font-article-body', fontOverrides?.articleBody?.family || defaultFont)
    root.style.setProperty('--font-size-article-body', fontOverrides?.articleBody?.size || defaultSizes.articleBody)
    root.style.setProperty('--font-header', fontOverrides?.header?.family || defaultFont)
    root.style.setProperty('--font-size-header', fontOverrides?.header?.size || defaultSizes.header)
    root.style.setProperty('--font-badge', fontOverrides?.badge?.family || defaultFont)
    root.style.setProperty('--font-size-badge', fontOverrides?.badge?.size || defaultSizes.badge)

    // Apply spacing
    root.style.setProperty('--spacing-sm', theme.spacing.gapSmall)
    root.style.setProperty('--spacing-md', theme.spacing.gapMedium)
    root.style.setProperty('--spacing-lg', theme.spacing.gapLarge)

    // Apply border radius
    root.style.setProperty('--radius-sm', theme.borderRadius.badge)
    root.style.setProperty('--radius-md', theme.borderRadius.thumbnail)
    root.style.setProperty('--radius-lg', theme.borderRadius.card)

    // Apply shadows
    root.style.setProperty('--shadow-card', theme.shadows.card)
    root.style.setProperty('--shadow-card-hover', theme.shadows.cardHover)
    root.style.setProperty('--shadow-thumbnail', theme.shadows.thumbnail)

    // Apply effects
    root.style.setProperty('--backdrop-blur', theme.effects.backdropFilter)
    root.style.setProperty('--transition-duration', theme.effects.transitionDuration)
    root.style.setProperty('--transition-easing', theme.effects.transitionEasing)
}

// Merge base theme with overrides
function mergeThemeWithOverrides(baseTheme: Theme, overrides: ThemeOverrides): Theme {
    return {
        ...baseTheme,
        colors: {
            background: { ...baseTheme.colors.background, ...overrides.colors?.background },
            accent: { ...baseTheme.colors.accent, ...overrides.colors?.accent },
            text: { ...baseTheme.colors.text, ...overrides.colors?.text },
            border: { ...baseTheme.colors.border, ...overrides.colors?.border },
        },
        typography: {
            ...baseTheme.typography,
            fontFamily: overrides.typography?.fontFamily ?? baseTheme.typography.fontFamily,
            sizes: { ...baseTheme.typography.sizes, ...overrides.typography?.sizes },
        },
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeState, setThemeState] = useState<ThemeState>(() => loadThemeState())
    const [loadedTheme, setLoadedTheme] = useState<Theme | null>(null)
    const [allThemes, setAllThemes] = useState<Map<string, Theme>>(new Map())
    const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [watermarkEnabled, setWatermarkEnabledState] = useState(false)
    const [watermarkColor, setWatermarkColorState] = useState('#7aa2f7')

    // Load all themes on mount
    useEffect(() => {
        async function initThemes() {
            setIsLoading(true)
            try {
                const themes = await loadAllThemes()
                setAllThemes(themes)

                // Load custom themes
                const savedCustomThemes = loadCustomThemes()
                setCustomThemes(savedCustomThemes)

                // Load the active theme
                let activeTheme: Theme | undefined

                // Check if it's a custom theme
                if (themeState.activeThemeId.startsWith('custom-')) {
                    const customTheme = savedCustomThemes.find(t => t.id === themeState.activeThemeId)
                    if (customTheme) {
                        const baseTheme = themes.get(customTheme.baseThemeId)
                        if (baseTheme) {
                            activeTheme = mergeThemeWithOverrides(baseTheme, customTheme.overrides)
                        }
                    }
                }

                if (!activeTheme) {
                    activeTheme = themes.get(themeState.activeThemeId) || themes.get(DEFAULT_THEME_ID)
                }

                if (activeTheme) {
                    setLoadedTheme(activeTheme)
                }
            } catch (error) {
                console.error('Failed to load themes:', error)
            } finally {
                setIsLoading(false)
            }
        }
        initThemes()
    }, [])

    // Load watermark settings on mount
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const saved = localStorage.getItem(WATERMARK_STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                setWatermarkEnabledState(parsed.enabled ?? false)
                setWatermarkColorState(parsed.color ?? '#7aa2f7')
            }
        } catch (error) {
            console.error('Failed to load watermark settings:', error)
        }
    }, [])

    // Update loaded theme when active theme changes
    useEffect(() => {
        // Check if it's a custom theme
        if (themeState.activeThemeId.startsWith('custom-')) {
            const customTheme = customThemes.find(t => t.id === themeState.activeThemeId)
            if (customTheme) {
                const baseTheme = allThemes.get(customTheme.baseThemeId)
                if (baseTheme) {
                    setLoadedTheme(mergeThemeWithOverrides(baseTheme, customTheme.overrides))
                    return
                }
            }
        }

        const theme = allThemes.get(themeState.activeThemeId)
        if (theme) {
            setLoadedTheme(theme)
        }
    }, [themeState.activeThemeId, allThemes, customThemes])

    // Compute the effective theme (base + overrides)
    const theme = useMemo(() => {
        if (!loadedTheme) return null
        return mergeThemeWithOverrides(loadedTheme, themeState.overrides)
    }, [loadedTheme, themeState.overrides])

    // Apply theme to CSS whenever it changes
    useEffect(() => {
        if (theme) {
            applyThemeToCss(theme, themeState.overrides.fonts)
        }
    }, [theme, themeState.overrides.fonts])

    // Persist theme state whenever it changes
    useEffect(() => {
        saveThemeState(themeState)
    }, [themeState])

    const setTheme = useCallback((id: string) => {
        // Check if it's a built-in theme or custom theme
        if (isValidThemeId(id) || id.startsWith('custom-')) {
            setThemeState({
                activeThemeId: id,
                // Clear overrides when switching themes
                overrides: {},
            })
        }
    }, [])

    const updateColorOverride = useCallback((group: keyof ThemeColors, key: string, value: string) => {
        setThemeState(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                colors: {
                    ...prev.overrides.colors,
                    [group]: {
                        ...(prev.overrides.colors?.[group] as Record<string, string>),
                        [key]: value,
                    },
                },
            },
        }))
    }, [])

    const resetColorOverride = useCallback((group: keyof ThemeColors, key: string) => {
        setThemeState(prev => {
            const currentGroupOverrides = prev.overrides.colors?.[group] as Record<string, string> | undefined
            if (!currentGroupOverrides || !(key in currentGroupOverrides)) {
                return prev
            }

            const { [key]: _, ...remainingOverrides } = currentGroupOverrides
            const hasRemainingOverrides = Object.keys(remainingOverrides).length > 0

            return {
                ...prev,
                overrides: {
                    ...prev.overrides,
                    colors: {
                        ...prev.overrides.colors,
                        [group]: hasRemainingOverrides ? remainingOverrides : undefined,
                    },
                },
            }
        })
    }, [])

    const isColorOverridden = useCallback((group: keyof ThemeColors, key: string): boolean => {
        const groupOverrides = themeState.overrides.colors?.[group] as Record<string, string> | undefined
        return groupOverrides !== undefined && key in groupOverrides
    }, [themeState.overrides.colors])

    const updateTypographyOverride = useCallback((key: string, value: string) => {
        setThemeState(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                typography: {
                    ...prev.overrides.typography,
                    [key]: value,
                },
            },
        }))
    }, [])

    const updateFontOverride = useCallback((element: keyof FontOverrides, font: { family?: string; size?: string }) => {
        setThemeState(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                fonts: {
                    ...prev.overrides.fonts,
                    [element]: {
                        ...prev.overrides.fonts?.[element],
                        ...font,
                    },
                },
            },
        }))
    }, [])

    const resetFontOverride = useCallback((element: keyof FontOverrides) => {
        setThemeState(prev => {
            const { [element]: _, ...remainingFonts } = prev.overrides.fonts || {}
            return {
                ...prev,
                overrides: {
                    ...prev.overrides,
                    fonts: Object.keys(remainingFonts).length > 0 ? remainingFonts : undefined,
                },
            }
        })
    }, [])

    const resetOverrides = useCallback(() => {
        setThemeState(prev => ({
            ...prev,
            overrides: {},
        }))
    }, [])

    const saveCustomTheme = useCallback((name: string) => {
        const newTheme: CustomTheme = {
            id: `custom-${Date.now()}`,
            name,
            baseThemeId: themeState.activeThemeId.startsWith('custom-') ? DEFAULT_THEME_ID : themeState.activeThemeId,
            overrides: themeState.overrides,
            createdAt: new Date().toISOString(),
        }

        setCustomThemes(prev => {
            const updated = [...prev, newTheme]
            saveCustomThemes(updated)
            return updated
        })

        // Switch to the new custom theme
        setThemeState({
            activeThemeId: newTheme.id,
            overrides: {},
        })
    }, [themeState.activeThemeId, themeState.overrides])

    const deleteCustomTheme = useCallback((id: string) => {
        setCustomThemes(prev => {
            const updated = prev.filter(t => t.id !== id)
            saveCustomThemes(updated)
            return updated
        })

        // If the deleted theme was active, switch to default
        if (themeState.activeThemeId === id) {
            setThemeState({
                activeThemeId: DEFAULT_THEME_ID,
                overrides: {},
            })
        }
    }, [themeState.activeThemeId])

    const availableThemes = useMemo<ThemeListItem[]>(() => {
        const builtIn = Array.from(allThemes.values()).map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
            isCustom: false,
        }))

        const custom = customThemes.map(t => ({
            id: t.id,
            name: t.name,
            type: 'dark' as const, // Custom themes inherit base type
            isCustom: true,
        }))

        return [...builtIn, ...custom]
    }, [allThemes, customThemes])

    const setWatermarkEnabled = useCallback((enabled: boolean) => {
        setWatermarkEnabledState(enabled)
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(WATERMARK_STORAGE_KEY)
            const current = saved ? JSON.parse(saved) : {}
            localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify({ ...current, enabled }))
        }
    }, [])

    const setWatermarkColor = useCallback((color: string) => {
        setWatermarkColorState(color)
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(WATERMARK_STORAGE_KEY)
            const current = saved ? JSON.parse(saved) : {}
            localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify({ ...current, color }))
        }
    }, [])

    const value: ThemeContextType = {
        theme,
        themeId: themeState.activeThemeId,
        overrides: themeState.overrides,
        watermarkEnabled,
        watermarkColor,
        isLoading,
        setTheme,
        updateColorOverride,
        resetColorOverride,
        updateTypographyOverride,
        updateFontOverride,
        resetFontOverride,
        resetOverrides,
        isColorOverridden,
        availableThemes,
        customThemes,
        saveCustomTheme,
        deleteCustomTheme,
        setWatermarkEnabled,
        setWatermarkColor,
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
