'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { Theme, ThemeColors, ThemeOverrides, ThemeState, ThemeListItem } from '../themes/types'
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
    // Update typography override
    updateTypographyOverride: (key: string, value: string) => void
    // Reset all overrides for current theme
    resetOverrides: () => void
    // Get list of all available themes
    availableThemes: ThemeListItem[]
    // Watermark controls
    setWatermarkEnabled: (enabled: boolean) => void
    setWatermarkColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'pirssonite_theme_state'
const WATERMARK_STORAGE_KEY = 'pirssonite_watermark'

// Load theme state from localStorage
function loadThemeState(): ThemeState {
    if (typeof window === 'undefined') {
        return { activeThemeId: DEFAULT_THEME_ID, overrides: {} }
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            // Validate the theme ID exists
            if (isValidThemeId(parsed.activeThemeId)) {
                return parsed
            }
        }
    } catch (error) {
        console.error('Failed to load theme state:', error)
    }

    return { activeThemeId: DEFAULT_THEME_ID, overrides: {} }
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
function applyThemeToCss(theme: Theme): void {
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

    // Apply typography
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

                // Load the active theme
                const activeTheme = themes.get(themeState.activeThemeId) || themes.get(DEFAULT_THEME_ID)
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
        const theme = allThemes.get(themeState.activeThemeId)
        if (theme) {
            setLoadedTheme(theme)
        }
    }, [themeState.activeThemeId, allThemes])

    // Compute the effective theme (base + overrides)
    const theme = useMemo(() => {
        if (!loadedTheme) return null
        return mergeThemeWithOverrides(loadedTheme, themeState.overrides)
    }, [loadedTheme, themeState.overrides])

    // Apply theme to CSS whenever it changes
    useEffect(() => {
        if (theme) {
            applyThemeToCss(theme)
        }
    }, [theme])

    // Persist theme state whenever it changes
    useEffect(() => {
        saveThemeState(themeState)
    }, [themeState])

    const setTheme = useCallback((id: string) => {
        if (isValidThemeId(id)) {
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

    const resetOverrides = useCallback(() => {
        setThemeState(prev => ({
            ...prev,
            overrides: {},
        }))
    }, [])

    const availableThemes = useMemo<ThemeListItem[]>(() => {
        return Array.from(allThemes.values()).map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
        }))
    }, [allThemes])

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
        updateTypographyOverride,
        resetOverrides,
        availableThemes,
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
