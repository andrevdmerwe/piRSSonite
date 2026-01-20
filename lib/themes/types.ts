// Theme system type definitions

export interface ThemeColors {
    // Backgrounds
    'background.app': string
    'background.sidebar': string
    'background.panel': string
    'background.card': string
    'background.cardHover': string

    // Borders
    'border.default': string
    'border.focus': string

    // Text
    'text.primary': string
    'text.secondary': string
    'text.muted': string

    // Accents
    'accent.primary': string
    'accent.secondary': string
    'accent.success': string
    'accent.warning': string
    'accent.danger': string

    // Badges
    'badge.unread': string
    'badge.read': string
    'badge.text': string  // Counter text color for contrast

    // Scrollbar
    'scrollbar.thumb': string
    'scrollbar.track': string
}

export interface ThemeFonts {
    ui: string
    content: string
    monospace: string
}

export interface ThemeFontSizes {
    base: number
    small: number
    large: number
}

export interface Theme {
    id: string
    name: string
    type: 'light' | 'dark'
    colors: ThemeColors
    fonts: ThemeFonts
    fontSizes: ThemeFontSizes
}

export interface ThemeOverrides {
    colors?: Partial<ThemeColors>
    fonts?: Partial<ThemeFonts>
    fontSizes?: Partial<ThemeFontSizes>
}

export interface ThemeState {
    activeThemeId: string
    overrides: ThemeOverrides
}

// Utility type for flattened override paths
export type ThemeOverridePath =
    | `colors.${keyof ThemeColors}`
    | `fonts.${keyof ThemeFonts}`
    | `fontSizes.${keyof ThemeFontSizes}`
