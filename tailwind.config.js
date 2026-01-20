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
        // Base backgrounds - dark code editor style
        'bg-main': '#05070A',
        'bg-panel': '#0B0F16',
        'bg-card': '#111623',
        'bg-accent': '#1a2233',
        'bg-card-hover': '#182030',

        // Text colors
        'text-primary': '#E5E9F0',
        'text-secondary': '#7A8395',
        'text-muted': '#5A6578',

        // Accent colors
        'accent-blue': '#3B82F6',
        'accent-green': '#10B981',
        'accent-cyan': '#3B82F6',
        'accent-purple': '#3B82F6',
        'accent-border': '#2a3545',

        // UI elements
        'badge-bg': '#1e2a3d',
        'border-soft': 'rgba(255,255,255,0.04)',
      },
      fontFamily: {
        mono: ['"Fira Code"', '"JetBrains Mono"', '"Source Code Pro"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
