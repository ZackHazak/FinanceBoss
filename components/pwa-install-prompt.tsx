"use client"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            return
        }

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(isIOSDevice)

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem("pwa-prompt-dismissed")
        if (dismissedAt) {
            const dismissedDate = new Date(dismissedAt)
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
            if (daysSinceDismissed < 7) return
        }

        // For iOS, show custom prompt after a delay
        if (isIOSDevice) {
            const timer = setTimeout(() => setShowPrompt(true), 3000)
            return () => clearTimeout(timer)
        }

        // For Android/Chrome, listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setTimeout(() => setShowPrompt(true), 2000)
        }

        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setShowPrompt(false)
        }
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem("pwa-prompt-dismissed", new Date().toISOString())
    }

    if (!showPrompt) return null

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80">
            <div className="rounded-xl border bg-background p-4 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm">התקן את Life OS</h3>
                        {isIOS ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                                לחץ על <span className="inline-block px-1">⎙</span> ואז &quot;הוסף למסך הבית&quot;
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-muted-foreground">
                                התקן את האפליקציה לגישה מהירה
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="rounded-full p-1 hover:bg-muted"
                        aria-label="סגור"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {!isIOS && deferredPrompt && (
                    <button
                        onClick={handleInstall}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        <Download className="h-4 w-4" />
                        התקן עכשיו
                    </button>
                )}
            </div>
        </div>
    )
}
