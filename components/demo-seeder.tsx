"use client"

import { useEffect, useState } from "react"

export function DemoSeeder() {
    const [status, setStatus] = useState<'idle' | 'seeding' | 'done' | 'error'>('idle')

    useEffect(() => {
        // Check if we already seeded in this session
        const hasSeeded = sessionStorage.getItem('demo-seeded')
        if (hasSeeded) return

        async function seedDemo() {
            setStatus('seeding')
            try {
                const res = await fetch('/api/seed-demo', { method: 'POST' })
                const data = await res.json()

                if (res.ok) {
                    setStatus('done')
                    sessionStorage.setItem('demo-seeded', 'true')
                    // Refresh page to show new data
                    setTimeout(() => window.location.reload(), 500)
                } else {
                    console.log('Seed skipped:', data.error || 'Not in preview')
                    setStatus('idle')
                }
            } catch (err) {
                console.error('Seed error:', err)
                setStatus('error')
            }
        }

        seedDemo()
    }, [])

    if (status === 'seeding') {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center">
                <div className="glass p-6 rounded-2xl text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-slate-700 font-medium">מכין נתוני דמו...</p>
                </div>
            </div>
        )
    }

    return null
}
