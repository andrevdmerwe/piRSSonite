// Theme system type definitions - New JSON-based structure

// Color groups matching theme-config.json structure
export interface ThemeBackgroundColors {
    primary: string
    secondary: string
    card: string
    cardHover: string
}

export interface ThemeAccentColors {
    unreadBadge: string
    unreadBadgeText: string
    readBadge: string
    link: string
    hoverAccent: string
    feedsUnreadText: string
}

export interface ThemeTextColors {
    primary: string
    secondary: string
    dimmed: string
    status: string
}

export interface ThemeBorderColors {
    card: string
    cardHover: string
    divider: string
}

export interface ThemeColors {
    background: ThemeBackgroundColors
    accent: ThemeAccentColors
    text: ThemeTextColors
    border: ThemeBorderColors
}

// Typography settings
export interface ThemeTypographySizes {
    sectionHeader: string
    feedItem: string
    badge: string
    articleTitle: string
    articleSubtitle: string
    preview: string
    metadata: string
}

export interface ThemeTypographyWeights {
    regular: number
    semibold: number
    bold: number
}

export interface ThemeTypographyLineHeights {
    compact: number
    normal: number
    relaxed: number
}

export interface ThemeTypography {
    fontFamily: string
    sizes: ThemeTypographySizes
    weights: ThemeTypographyWeights
    lineHeights: ThemeTypographyLineHeights
}

// Spacing and sizing
export interface ThemeSpacing {
    cardMargin: string
    cardPadding: string
    sectionSpacing: string
    itemLineHeight: number
    gapSmall: string
    gapMedium: string
    gapLarge: string
}

export interface ThemeBorderRadius {
    card: string
    badge: string
    thumbnail: string
}

export interface ThemeShadows {
    card: string
    cardHover: string
    thumbnail: string
}

export interface ThemeEffects {
    glassBlur: string
    backdropFilter: string
    transitionDuration: string
    transitionEasing: string
}

// Complete Theme interface
export interface Theme {
    id: string
    name: string
    type: 'light' | 'dark'
    version?: string
    description?: string
    colors: ThemeColors
    typography: ThemeTypography
    spacing: ThemeSpacing
    borderRadius: ThemeBorderRadius
    shadows: ThemeShadows
    effects: ThemeEffects
}

// User overrides - allows partial customization
export interface ThemeOverrides {
    colors?: {
        background?: Partial<ThemeBackgroundColors>
        accent?: Partial<ThemeAccentColors>
        text?: Partial<ThemeTextColors>
        border?: Partial<ThemeBorderColors>
    }
    typography?: {
        fontFamily?: string
        sizes?: Partial<ThemeTypographySizes>
    }
    fonts?: FontOverrides
}

// Per-element font customization
export interface ElementFont {
    family?: string
    size?: string
}

export interface FontOverrides {
    folderName?: ElementFont
    feedName?: ElementFont
    articleHeading?: ElementFont
    articleBody?: ElementFont
    header?: ElementFont
    badge?: ElementFont
}

// Theme state for persistence
export interface ThemeState {
    activeThemeId: string
    overrides: ThemeOverrides
}

// Theme list item for dropdowns
export interface ThemeListItem {
    id: string
    name: string
    type: 'light' | 'dark'
    isCustom?: boolean
}

// Custom theme saved by user
export interface CustomTheme {
    id: string
    name: string
    baseThemeId: string
    overrides: ThemeOverrides
    createdAt: string
}
