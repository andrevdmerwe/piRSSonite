/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-card': 'var(--color-bg-card)',
        'bg-card-hover': 'var(--color-bg-card-hover)',

        // Accent colors
        'accent-unread': 'var(--color-accent-unread)',
        'accent-unread-text': 'var(--color-accent-unread-text)',
        'accent-read': 'var(--color-accent-read)',
        'accent-link': 'var(--color-accent-link)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-feeds-unread-text': 'var(--color-accent-feeds-unread-text)',

        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-dimmed': 'var(--color-text-dimmed)',
        'text-status': 'var(--color-text-status)',

        // Border colors
        'border-card': 'var(--color-border-card)',
        'border-card-hover': 'var(--color-border-card-hover)',
        'border-divider': 'var(--color-border-divider)',
      },
      fontFamily: {
        mono: ['var(--font-family-mono)'],
        'folder-name': ['var(--font-folder-name)'],
        'feed-name': ['var(--font-feed-name)'],
        'article-heading': ['var(--font-article-heading)'],
        'article-body': ['var(--font-article-body)'],
        'header': ['var(--font-header)'],
        'badge': ['var(--font-badge)'],
      },
      fontSize: {
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)',
        'base': 'var(--font-size-base)',
        'lg': 'var(--font-size-lg)',
        'xl': 'var(--font-size-xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'thumbnail': 'var(--shadow-thumbnail)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
      },
      transitionDuration: {
        'theme': 'var(--transition-duration)',
      },
      backdropBlur: {
        'glass': '10px',
      },
    },
  },
  plugins: [],
}
