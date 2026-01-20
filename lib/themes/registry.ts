// Theme registry with all predefined themes
import { Theme } from './types'

// Default fonts used across themes
const defaultFonts = {
    ui: '"Fira Code", "JetBrains Mono", "Source Code Pro", Menlo, monospace',
    content: '"Fira Code", "JetBrains Mono", "Source Code Pro", Menlo, monospace',
    monospace: '"Fira Code", "JetBrains Mono", "Source Code Pro", Menlo, monospace',
}

const defaultFontSizes = {
    base: 14,
    small: 12,
    large: 16,
}

// Catppuccin Latte (Light theme)
// Source: https://github.com/catppuccin/catppuccin
export const catppuccinLatte: Theme = {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    type: 'light',
    colors: {
        'background.app': '#eff1f5',      // Base
        'background.sidebar': '#e6e9ef',  // Mantle
        'background.panel': '#dce0e8',    // Crust
        'background.card': '#ccd0da',     // Surface0
        'background.cardHover': '#bcc0cc', // Surface1
        'border.default': '#acb0be',      // Surface2
        'border.focus': '#7287fd',        // Lavender
        'text.primary': '#4c4f69',        // Text
        'text.secondary': '#5c5f77',      // Subtext1
        'text.muted': '#6c6f85',          // Subtext0
        'accent.primary': '#1e66f5',      // Blue
        'accent.secondary': '#8839ef',    // Mauve
        'accent.success': '#40a02b',      // Green
        'accent.warning': '#df8e1d',      // Yellow
        'accent.danger': '#d20f39',       // Red
        'badge.unread': '#8839ef',        // Mauve
        'badge.read': '#40a02b',          // Green
        'badge.text': '#eff1f5',          // Base (light text for dark badges)
        'scrollbar.thumb': '#acb0be',     // Surface2
        'scrollbar.track': 'transparent',
    },
    fonts: defaultFonts,
    fontSizes: defaultFontSizes,
}

// Catppuccin Mocha (Dark theme)
// Source: https://github.com/catppuccin/catppuccin
export const catppuccinMocha: Theme = {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    type: 'dark',
    colors: {
        'background.app': '#1e1e2e',      // Base
        'background.sidebar': '#181825',  // Mantle
        'background.panel': '#11111b',    // Crust
        'background.card': '#313244',     // Surface0
        'background.cardHover': '#45475a', // Surface1
        'border.default': '#585b70',      // Surface2
        'border.focus': '#b4befe',        // Lavender
        'text.primary': '#cdd6f4',        // Text
        'text.secondary': '#bac2de',      // Subtext1
        'text.muted': '#a6adc8',          // Subtext0
        'accent.primary': '#89b4fa',      // Blue
        'accent.secondary': '#cba6f7',    // Mauve
        'accent.success': '#a6e3a1',      // Green
        'accent.warning': '#f9e2af',      // Yellow
        'accent.danger': '#f38ba8',       // Red
        'badge.unread': '#cba6f7',        // Mauve
        'badge.read': '#a6e3a1',          // Green
        'badge.text': '#1e1e2e',          // Base (dark text for light badges)
        'scrollbar.thumb': '#585b70',     // Surface2
        'scrollbar.track': 'transparent',
    },
    fonts: defaultFonts,
    fontSizes: defaultFontSizes,
}

// Nord (Dark theme)
// Source: https://www.nordtheme.com/docs/colors-and-palettes
export const nord: Theme = {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
        'background.app': '#2e3440',      // Nord0 - Polar Night
        'background.sidebar': '#3b4252',  // Nord1
        'background.panel': '#434c5e',    // Nord2
        'background.card': '#4c566a',     // Nord3
        'background.cardHover': '#5e6779',
        'border.default': '#4c566a',      // Nord3
        'border.focus': '#88c0d0',        // Nord8 - Frost
        'text.primary': '#eceff4',        // Nord6 - Snow Storm
        'text.secondary': '#e5e9f0',      // Nord5
        'text.muted': '#d8dee9',          // Nord4
        'accent.primary': '#88c0d0',      // Nord8 - Frost
        'accent.secondary': '#81a1c1',    // Nord9
        'accent.success': '#a3be8c',      // Nord14 - Aurora
        'accent.warning': '#ebcb8b',      // Nord13
        'accent.danger': '#bf616a',       // Nord11
        'badge.unread': '#b48ead',        // Nord15
        'badge.read': '#a3be8c',          // Nord14
        'badge.text': '#2e3440',          // Nord0 (dark text for light badges)
        'scrollbar.thumb': '#4c566a',     // Nord3
        'scrollbar.track': 'transparent',
    },
    fonts: defaultFonts,
    fontSizes: defaultFontSizes,
}

// Tokyo Night (Dark theme)
// Source: https://github.com/enkia/tokyo-night-vscode-theme
export const tokyoNight: Theme = {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    type: 'dark',
    colors: {
        'background.app': '#1a1b26',      // Background
        'background.sidebar': '#16161e',
        'background.panel': '#1f2335',
        'background.card': '#24283b',     // Terminal Black
        'background.cardHover': '#292e42',
        'border.default': '#3b4261',
        'border.focus': '#7aa2f7',        // Blue
        'text.primary': '#c0caf5',        // Foreground
        'text.secondary': '#a9b1d6',
        'text.muted': '#565f89',          // Comment
        'accent.primary': '#7aa2f7',      // Blue
        'accent.secondary': '#bb9af7',    // Purple
        'accent.success': '#9ece6a',      // Green
        'accent.warning': '#e0af68',      // Yellow
        'accent.danger': '#f7768e',       // Red
        'badge.unread': '#bb9af7',        // Purple
        'badge.read': '#9ece6a',          // Green
        'badge.text': '#1a1b26',          // Background (dark text for light badges)
        'scrollbar.thumb': '#3b4261',
        'scrollbar.track': 'transparent',
    },
    fonts: defaultFonts,
    fontSizes: defaultFontSizes,
}

// Kanagawa (Dark theme)
// Source: https://github.com/rebelot/kanagawa.nvim
export const kanagawa: Theme = {
    id: 'kanagawa',
    name: 'Kanagawa',
    type: 'dark',
    colors: {
        'background.app': '#1f1f28',      // sumiInk1
        'background.sidebar': '#16161d',  // sumiInk0
        'background.panel': '#2a2a37',    // sumiInk3
        'background.card': '#363646',     // sumiInk4
        'background.cardHover': '#54546d', // sumiInk5
        'border.default': '#54546d',      // sumiInk5
        'border.focus': '#7e9cd8',        // crystalBlue
        'text.primary': '#dcd7ba',        // fujiWhite
        'text.secondary': '#c8c093',      // oldWhite
        'text.muted': '#727169',          // fujiGray
        'accent.primary': '#7e9cd8',      // crystalBlue
        'accent.secondary': '#957fb8',    // oniViolet
        'accent.success': '#98bb6c',      // springGreen
        'accent.warning': '#e6c384',      // carpYellow
        'accent.danger': '#c34043',       // autumnRed
        'badge.unread': '#957fb8',        // oniViolet
        'badge.read': '#98bb6c',          // springGreen
        'badge.text': '#1f1f28',          // sumiInk1 (dark text for light badges)
        'scrollbar.thumb': '#54546d',     // sumiInk5
        'scrollbar.track': 'transparent',
    },
    fonts: defaultFonts,
    fontSizes: defaultFontSizes,
}

// Osaka Jade (Dark theme - custom inspired by jade/green aesthetic)
export const osakaJade: Theme = {
    id: 'osaka-jade',
    name: 'Osaka Jade',
    type: 'dark',
    colors: {
        'background.app': '#0d1117',      // Very dark
        'background.sidebar': '#161b22',
        'background.panel': '#21262d',
        'background.card': '#30363d',
        'background.cardHover': '#3b434b',
        'border.default': '#3b434b',
        'border.focus': '#3fb950',        // Jade green
        'text.primary': '#e6edf3',
        'text.secondary': '#b1bac4',
        'text.muted': '#768390',
        'accent.primary': '#3fb950',      // Jade green
        'accent.secondary': '#58a6ff',    // Blue
        'accent.success': '#3fb950',      // Green
        'accent.warning': '#d29922',      // Yellow
        'accent.danger': '#f85149',       // Red
        'badge.unread': '#58a6ff',        // Blue
        'badge.read': '#3fb950',          // Green
        'badge.text': '#0d1117',          // Very dark (dark text for light badges)
        'scrollbar.thumb': '#3b434b',
        'scrollbar.track': 'transparent',
    },
    fonts: defaultFonts,
    fontSizes: defaultFontSizes,
}

// Theme registry - all available themes
export const themeRegistry: Record<string, Theme> = {
    'catppuccin-latte': catppuccinLatte,
    'catppuccin': catppuccinMocha,
    'nord': nord,
    'tokyo-night': tokyoNight,
    'kanagawa': kanagawa,
    'osaka-jade': osakaJade,
}

// Get list of all themes for dropdown
export const getThemeList = (): { id: string; name: string; type: string }[] => {
    return Object.values(themeRegistry).map(theme => ({
        id: theme.id,
        name: theme.name,
        type: theme.type,
    }))
}

// Get theme by ID
export const getTheme = (id: string): Theme | undefined => {
    return themeRegistry[id]
}

// Default theme
export const DEFAULT_THEME_ID = 'tokyo-night'
