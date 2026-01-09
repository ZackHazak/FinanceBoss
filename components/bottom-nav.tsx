"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, List, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { href: "/", label: "בית", icon: Home },
        { href: "/transactions", label: "תנועות", icon: List },
        { href: "/add", label: "הוספה", icon: PlusCircle },
        { href: "/stats", label: "דוחות", icon: PieChart },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-lg md:hidden">
            <div className="flex h-16 items-center justify-around px-4">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:text-primary",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span>{label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
