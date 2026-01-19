import type { Metadata } from 'next'
import './globals.css'
import AutoRefresher from '@/components/AutoRefresher'
import { UnreadCountsProvider } from '@/lib/context/UnreadCountsContext'

export const metadata: Metadata = {
  title: 'piRSSonite',
  description: 'self_hosted_rss_reader',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UnreadCountsProvider>
          <AutoRefresher />
          {children}
        </UnreadCountsProvider>
      </body>
    </html>
  )
}
