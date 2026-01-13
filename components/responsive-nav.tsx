"use client"

import { BottomNav } from "@/components/bottom-nav"
import { Sidebar } from "@/components/sidebar"
import { PageTransition } from "@/components/animations"

export function ResponsiveNav({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-row">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                <PageTransition>
                    {children}
                </PageTransition>
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav />
        </div>
    )
}
