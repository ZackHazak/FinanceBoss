"use client"

import { BottomNav } from "@/components/bottom-nav"
import { Sidebar } from "@/components/sidebar"
import { usePathname } from "next/navigation"

export function ResponsiveNav({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isHub = pathname === "/"

    if (isHub) {
        return <>{children}</>
    }

    return (
        <div className="flex min-h-screen flex-row">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 pb-16 md:pb-0">
                {children}
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav />
        </div>
    )
}
