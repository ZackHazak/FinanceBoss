"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Wallet, Apple, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname()

    const navItems = [
        { href: "/", label: "בית", icon: Home, gradient: "gradient-purple" },
        { href: "/body", label: "Body", icon: Dumbbell, gradient: "gradient-pink" },
        { href: "/nutrition", label: "Nutrition", icon: Apple, gradient: "gradient-green" },
        { href: "/finance", label: "Finance", icon: Wallet, gradient: "gradient-blue" },
    ]

    return (
        <div className="hidden h-screen w-72 flex-col glass-strong border-l border-white/20 md:flex">
            {/* Logo Section */}
            <div className="p-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl gradient-purple shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight gradient-text">LifOS</h1>
                        <p className="text-xs text-slate-500">ניהול פיננסים וכושר</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(({ href, label, icon: Icon, gradient }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                                isActive
                                    ? "glass-card text-slate-800 shadow-md"
                                    : "text-slate-600 hover:bg-white/30"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-lg transition-all",
                                isActive ? gradient : "bg-slate-100"
                            )}>
                                <Icon className={cn(
                                    "h-4 w-4",
                                    isActive ? "text-white" : "text-slate-500"
                                )} />
                            </div>
                            <span>{label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/20">
                <p className="text-center text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} LifOS
                </p>
            </div>
        </div>
    )
}
