'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { Theme, ThemeColors, ThemeFonts, ThemeFontSizes, ThemeOverrides, ThemeState } from '../themes/types'
import { getTheme, DEFAULT_THEME_ID, themeRegistry } from '../themes/registry'

interface ThemeContextType {
    // Current theme (with overrides applied)
    theme: Theme
    // Active theme ID
    themeId: string
    // User overrides
    overrides: ThemeOverrides
    // Switch to a different theme
    setTheme: (id: string) => void
    // Update a color override
    updateColorOverride: (key: keyof ThemeColors, value: string) => void
    // Update a font override
    updateFontOverride: (key: keyof ThemeFonts, value: string) => void
    // Update a font size override
    updateFontSizeOverride: (key: keyof ThemeFontSizes, value: number) => void
    // Reset all overrides for current theme
    resetOverrides: () => void
    // Get list of all available themes
    availableThemes: { id: string; name: string; type: string }[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'pirssonite_theme_state'

// Load theme state from localStorage
function loadThemeState(): ThemeState {
    if (typeof window === 'undefined') {
        return { activeThemeId: DEFAULT_THEME_ID, overrides: {} }
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            // Validate the theme exists
            if (getTheme(parsed.activeThemeId)) {
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

    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
        const cssVarName = `--color-${key.replace(/\./g, '-')}`
        root.style.setProperty(cssVarName, value)
    })

    // Apply fonts
    root.style.setProperty('--font-ui', theme.fonts.ui)
    root.style.setProperty('--font-content', theme.fonts.content)
    root.style.setProperty('--font-monospace', theme.fonts.monospace)

    // Apply font sizes
    root.style.setProperty('--font-size-base', `${theme.fontSizes.base}px`)
    root.style.setProperty('--font-size-small', `${theme.fontSizes.small}px`)
    root.style.setProperty('--font-size-large', `${theme.fontSizes.large}px`)
}

// Merge base theme with overrides
function mergeThemeWithOverrides(baseTheme: Theme, overrides: ThemeOverrides): Theme {
    return {
        ...baseTheme,
        colors: { ...baseTheme.colors, ...overrides.colors },
        fonts: { ...baseTheme.fonts, ...overrides.fonts },
        fontSizes: { ...baseTheme.fontSizes, ...overrides.fontSizes },
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeState, setThemeState] = useState<ThemeState>(() => loadThemeState())

    // Compute the effective theme (base + overrides)
    const theme = useMemo(() => {
        const baseTheme = getTheme(themeState.activeThemeId) || getTheme(DEFAULT_THEME_ID)!
        return mergeThemeWithOverrides(baseTheme, themeState.overrides)
    }, [themeState])

    // Apply theme to CSS whenever it changes
    useEffect(() => {
        applyThemeToCss(theme)
    }, [theme])

    // Persist theme state whenever it changes
    useEffect(() => {
        saveThemeState(themeState)
    }, [themeState])

    const setTheme = useCallback((id: string) => {
        if (getTheme(id)) {
            setThemeState(prev => ({
                activeThemeId: id,
                // Clear overrides when switching themes
                overrides: {},
            }))
        }
    }, [])

    const updateColorOverride = useCallback((key: keyof ThemeColors, value: string) => {
        setThemeState(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                colors: { ...prev.overrides.colors, [key]: value },
            },
        }))
    }, [])

    const updateFontOverride = useCallback((key: keyof ThemeFonts, value: string) => {
        setThemeState(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                fonts: { ...prev.overrides.fonts, [key]: value },
            },
        }))
    }, [])

    const updateFontSizeOverride = useCallback((key: keyof ThemeFontSizes, value: number) => {
        setThemeState(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                fontSizes: { ...prev.overrides.fontSizes, [key]: value },
            },
        }))
    }, [])

    const resetOverrides = useCallback(() => {
        setThemeState(prev => ({
            ...prev,
            overrides: {},
        }))
    }, [])

    const availableThemes = useMemo(() => {
        return Object.values(themeRegistry).map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
        }))
    }, [])

    const value: ThemeContextType = {
        theme,
        themeId: themeState.activeThemeId,
        overrides: themeState.overrides,
        setTheme,
        updateColorOverride,
        updateFontOverride,
        updateFontSizeOverride,
        resetOverrides,
        availableThemes,
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
