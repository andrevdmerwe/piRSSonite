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
        // Backgrounds - using CSS variables for theme support
        'bg-main': 'var(--color-background-app)',
        'bg-panel': 'var(--color-background-sidebar)',
        'bg-card': 'var(--color-background-card)',
        'bg-accent': 'var(--color-background-panel)',
        'bg-card-hover': 'var(--color-background-cardHover)',

        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',

        // Accent colors
        'accent-cyan': 'var(--color-accent-primary)',
        'accent-purple': 'var(--color-accent-secondary)',
        'accent-blue': 'var(--color-accent-primary)',
        'accent-green': 'var(--color-accent-success)',
        'accent-border': 'var(--color-border-default)',

        // UI elements
        'badge-bg': 'var(--color-background-panel)',
        'badge-text': 'var(--color-badge-text)',
        'border-soft': 'var(--color-border-default)',
      },
      fontFamily: {
        mono: ['var(--font-monospace)'],
        ui: ['var(--font-ui)'],
        content: ['var(--font-content)'],
      },
    },
  },
  plugins: [],
}
