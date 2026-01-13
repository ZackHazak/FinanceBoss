"use client"

import { motion } from "framer-motion"
import { WeeklySummary, GRADE_COLORS } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import { Calendar, TrendingUp, Award, Target, ChevronLeft } from "lucide-react"

interface WeeklySummaryCardProps {
    summary: WeeklySummary
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
    const statsItems = [
        {
            label: 'ימים מתועדים',
            value: summary.daysLogged,
            suffix: '/7',
            icon: Calendar,
            color: 'text-blue-500'
        },
        {
            label: 'יעדים שהושגו',
            value: summary.goalsMetCount,
            suffix: '/7',
            icon: Target,
            color: 'text-green-500'
        },
        {
            label: 'ממוצע קלוריות',
            value: Math.round(summary.avgCalories).toLocaleString(),
            suffix: '',
            icon: TrendingUp,
            color: 'text-orange-500'
        },
        {
            label: 'ממוצע חלבון',
            value: Math.round(summary.avgProtein),
            suffix: 'g',
            icon: Award,
            color: 'text-red-500'
        }
    ]

    const formatDateRange = () => {
        const start = new Date(summary.weekStart)
        const end = new Date(summary.weekEnd)
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
        return `${start.toLocaleDateString('he-IL', options)} - ${end.toLocaleDateString('he-IL', options)}`
    }

    return (
        <motion.div
            className="relative overflow-hidden rounded-2xl border bg-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header with gradient */}
            <div className="relative p-6 pb-12 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-1">סיכום שבועי</h3>
                        <p className="text-sm text-muted-foreground">{formatDateRange()}</p>
                    </div>

                    {/* Grade badge */}
                    <motion.div
                        className="relative"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${GRADE_COLORS[summary.score.grade]}, ${GRADE_COLORS[summary.score.grade]}90)`,
                                boxShadow: `0 8px 32px ${GRADE_COLORS[summary.score.grade]}40`
                            }}
                        >
                            <span className="text-2xl font-bold text-white">{summary.score.grade}</span>
                        </div>
                        {/* Decorative ring */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl border-2"
                            style={{ borderColor: GRADE_COLORS[summary.score.grade] }}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                    </motion.div>
                </div>

                {/* Decorative circles */}
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
                <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-px bg-border -mt-6 mx-4 rounded-xl overflow-hidden shadow-sm">
                {statsItems.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <motion.div
                            key={stat.label}
                            className="bg-card p-4 flex flex-col items-center text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                        >
                            <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-xl font-bold">{stat.value}</span>
                                <span className="text-xs text-muted-foreground">{stat.suffix}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1">{stat.label}</span>
                        </motion.div>
                    )
                })}
            </div>

            {/* Best day highlight */}
            {summary.bestDay && (
                <motion.div
                    className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        <div>
                            <p className="text-xs text-green-700">היום הטוב ביותר</p>
                            <p className="text-sm font-medium text-green-800">{summary.bestDay}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Score breakdown mini */}
            <div className="p-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">ציון כולל</span>
                    <span className="text-sm font-medium">{summary.score.overall}/100</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: `linear-gradient(90deg, ${GRADE_COLORS[summary.score.grade]}, ${GRADE_COLORS[summary.score.grade]}80)`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${summary.score.overall}%` }}
                        transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* View details link */}
            <motion.button
                className="w-full p-4 border-t flex items-center justify-center gap-2 text-sm text-primary hover:bg-accent/50 transition-colors"
                whileHover={{ x: -5 }}
            >
                <span>צפה בדוח המלא</span>
                <ChevronLeft className="w-4 h-4" />
            </motion.button>
        </motion.div>
    )
}
