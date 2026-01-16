import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { ResponsiveNav } from "@/components/responsive-nav"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { DemoSeeder } from "@/components/demo-seeder"

const isPreview = process.env.VERCEL_ENV === 'preview'

const heebo = Heebo({ subsets: ['hebrew', 'latin'] })

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'מערכת ניהול חיים אישית - פיננסים, כושר ותזונה',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Life OS',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  width: 'device-width',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={heebo.className}>
        <ResponsiveNav>
          {children}
        </ResponsiveNav>
        <PWAInstallPrompt />
        {isPreview && <DemoSeeder />}
      </body>
    </html>
  )
}
