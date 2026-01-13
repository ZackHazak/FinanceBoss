import Link from "next/link"
import { Wallet, Dumbbell } from "lucide-react"

export default function HubPage() {
    const modules = [
        {
            title: "Body",
            href: "/body",
            icon: Dumbbell,
            color: "bg-red-500",
            description: "אימונים וכושר"
        },
        {
            title: "Fitness Tracker",
            href: "/fitness",
            icon: Dumbbell,
            color: "bg-green-500",
            description: "מעקב התקדמות ויומן"
        },
        {
            title: "Finance",
            href: "/finance",
            icon: Wallet,
            color: "bg-blue-500",
            description: "מעקב הוצאות והכנסות"
        }
    ]

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">LifOS</h1>
                <p className="mt-2 text-lg text-muted-foreground">מערכת ניהול חיים כוללת</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 max-w-4xl w-full">
                {modules.map((module) => (
                    <Link
                        key={module.title}
                        href={module.href}
                        className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:scale-105 hover:shadow-lg"
                    >
                        <div className={`absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20 ${module.color}`} />
                        <module.icon className={`mb-4 h-12 w-12 ${module.color.replace("bg-", "text-")}`} />
                        <h2 className="text-2xl font-bold">{module.title}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
