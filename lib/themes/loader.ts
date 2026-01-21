// Theme loader utility - loads themes from JSON files
import { Theme, ThemeListItem } from './types'

// Available theme IDs - these correspond to JSON files in /themes/
export const AVAILABLE_THEMES = [
    'glassy',
    'tokyo-night',
    'catppuccin-mocha',
    'catppuccin-latte',
    'nord',
    'kanagawa',
    'osaka-jade',
] as const

export const DEFAULT_THEME_ID = 'glassy'

// Cache for loaded themes
const themeCache = new Map<string, Theme>()

// Load a single theme from JSON
export async function loadTheme(themeId: string): Promise<Theme | null> {
    // Check cache first
    if (themeCache.has(themeId)) {
        return themeCache.get(themeId)!
    }

    try {
        const response = await fetch(`/themes/${themeId}.json`)
        if (!response.ok) {
            console.error(`Failed to load theme ${themeId}: ${response.status}`)
            return null
        }

        const theme: Theme = await response.json()
        themeCache.set(themeId, theme)
        return theme
    } catch (error) {
        console.error(`Error loading theme ${themeId}:`, error)
        return null
    }
}

// Load all themes and return as a map
export async function loadAllThemes(): Promise<Map<string, Theme>> {
    const themes = new Map<string, Theme>()

    await Promise.all(
        AVAILABLE_THEMES.map(async (themeId) => {
            const theme = await loadTheme(themeId)
            if (theme) {
                themes.set(themeId, theme)
            }
        })
    )

    return themes
}

// Get theme list for dropdowns (loads themes if not cached)
export async function getThemeList(): Promise<ThemeListItem[]> {
    const themes = await loadAllThemes()
    return Array.from(themes.values()).map((theme) => ({
        id: theme.id,
        name: theme.name,
        type: theme.type,
    }))
}

// Validate a theme ID
export function isValidThemeId(themeId: string): boolean {
    return AVAILABLE_THEMES.includes(themeId as typeof AVAILABLE_THEMES[number])
}

// Clear theme cache (useful for development/hot reload)
export function clearThemeCache(): void {
    themeCache.clear()
}

// Get default theme
export async function getDefaultTheme(): Promise<Theme> {
    const theme = await loadTheme(DEFAULT_THEME_ID)
    if (!theme) {
        throw new Error(`Failed to load default theme: ${DEFAULT_THEME_ID}`)
    }
    return theme
}
