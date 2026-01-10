"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, List, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const pathname = usePathname()

    const navItems = [
        { href: "/", label: "בית", icon: Home },
        { href: "/transactions", label: "תנועות", icon: List },
        { href: "/add", label: "הוספה", icon: PlusCircle },
        { href: "/stats", label: "דוחות", icon: PieChart },
    ]

    return (
        <div className="hidden h-screen w-64 flex-col border-l bg-card text-card-foreground shadow-sm md:flex">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Life OS</h1>
                <p className="text-xs text-muted-foreground">ניהול פיננסים חכם</p>
            </div>
            <nav className="flex-1 space-y-2 px-4">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{label}</span>
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 text-center text-xs text-muted-foreground opacity-50">
                &copy; {new Date().getFullYear()} Finance Boss
            </div>
        </div>
    )
}
