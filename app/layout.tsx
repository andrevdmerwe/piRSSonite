import type { Metadata } from 'next'
import './globals.css'
import AutoRefresher from '@/components/AutoRefresher'
import { UnreadCountsProvider } from '@/lib/context/UnreadCountsContext'
import { ThemeProvider } from '@/lib/context/ThemeContext'

export const metadata: Metadata = {
  title: 'piRSSonite',
  description: 'self_hosted_rss_reader',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <UnreadCountsProvider>
            <AutoRefresher />
            {children}
          </UnreadCountsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
