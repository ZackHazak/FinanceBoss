import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { ResponsiveNav } from "@/components/responsive-nav"

const heebo = Heebo({ subsets: ['hebrew', 'latin'] })

export const metadata: Metadata = {
  title: 'ניהול חיים - פיננסים',
  description: 'מערכת ניהול פיננסים אישי',
}

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  maximumScale: 1,
  width: 'device-width',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>
        <ResponsiveNav>
          {children}
        </ResponsiveNav>
      </body>
    </html>
  )
}
