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
        'bg-main': '#1e1e2e',
        'bg-panel': '#232335',
        'bg-card': '#2a2a40',
        'bg-accent': '#313155',
        'text-primary': '#e6e6f0',
        'text-secondary': '#a7a7c2',
        'text-muted': '#7a7aa3',
        'accent-cyan': '#3fd0d4',
        'accent-purple': '#b38df6',
        'accent-border': '#8a6fd1',
        'badge-bg': '#3a3a5a',
        'border-soft': 'rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}
