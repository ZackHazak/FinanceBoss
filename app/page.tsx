import Link from "next/link"
import { Wallet, Dumbbell, Apple, Activity, Sparkles } from "lucide-react"

export default function HubPage() {
    const modules = [
        {
            title: "Body",
            href: "/body",
            icon: Activity,
            gradient: "gradient-pink",
            iconColor: "text-pink-500",
            description: "אימונים וכושר"
        },
        {
            title: "Nutrition",
            href: "/nutrition",
            icon: Apple,
            gradient: "gradient-green",
            iconColor: "text-emerald-500",
            description: "מעקב תזונה וקלוריות"
        },
        {
            title: "Finance",
            href: "/finance",
            icon: Wallet,
            gradient: "gradient-blue",
            iconColor: "text-blue-500",
            description: "מעקב הוצאות והכנסות"
        },
        {
            title: "Fitness Tracker",
            href: "/fitness",
            icon: Dumbbell,
            gradient: "gradient-purple",
            iconColor: "text-violet-500",
            description: "מעקב התקדמות ויומן"
        }
    ]

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
            {/* Hero Section */}
            <div className="mb-12 text-center relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                    <Sparkles className="h-6 w-6 text-violet-400 animate-pulse" />
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl gradient-text">
                    LifOS
                </h1>
                <p className="mt-3 text-lg text-slate-600">
                    מערכת ניהול חיים כוללת
                </p>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6 max-w-4xl w-full">
                {modules.map((module, index) => (
                    <Link
                        key={module.title}
                        href={module.href}
                        className="group relative glass-card rounded-3xl p-5 sm:p-6 md:p-8 overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Gradient Background on Hover */}
                        <div className={`absolute inset-0 ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                        {/* Icon Container */}
                        <div className={`relative mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl ${module.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <module.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                        </div>

                        {/* Content */}
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-1">
                            {module.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                            {module.description}
                        </p>

                        {/* Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bottom Decoration */}
            <div className="mt-12 flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-slate-300" />
                <span>נבנה באהבה</span>
                <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-slate-300" />
            </div>
        </div>
    )
}
