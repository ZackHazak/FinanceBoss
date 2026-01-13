"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Wallet, Apple } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { href: "/", label: "בית", icon: Home, gradient: "from-violet-500 to-purple-500" },
        { href: "/body", label: "Body", icon: Dumbbell, gradient: "from-pink-500 to-rose-500" },
        { href: "/nutrition", label: "Nutrition", icon: Apple, gradient: "from-emerald-500 to-green-500" },
        { href: "/finance", label: "Finance", icon: Wallet, gradient: "from-blue-500 to-indigo-500" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 glass-nav md:hidden pb-[env(safe-area-inset-bottom)]">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map(({ href, label, icon: Icon, gradient }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all py-2 px-3 rounded-xl",
                                isActive
                                    ? "text-slate-900"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all",
                                isActive
                                    ? `bg-gradient-to-r ${gradient} shadow-lg`
                                    : "bg-transparent"
                            )}>
                                <Icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-white" : "text-slate-500"
                                )} />
                            </div>
                            <span className={cn(
                                "transition-all",
                                isActive && "font-semibold"
                            )}>{label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
