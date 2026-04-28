import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Trend Monitor — Dashboard',
  description: 'Content intelligence & script generation',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grain" />
        {children}
      </body>
    </html>
  )
}
