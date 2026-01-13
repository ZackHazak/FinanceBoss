"use client"

import { motion } from "framer-motion"
import { MacroTrend, MACRO_COLORS, TREND_LABELS } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Flame, Beef, Wheat, Droplet } from "lucide-react"

interface MacroTrendCardsProps {
    trends: MacroTrend[]
}

const MACRO_ICONS = {
    calories: Flame,
    protein: Beef,
    carbs: Wheat,
    fat: Droplet
}

const MACRO_LABELS = {
    calories: 'קלוריות',
    protein: 'חלבון',
    carbs: 'פחמימות',
    fat: 'שומן'
}

const MACRO_UNITS = {
    calories: 'קק"ל',
    protein: 'ג',
    carbs: 'ג',
    fat: 'ג'
}

export function MacroTrendCards({ trends }: MacroTrendCardsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {trends.map((trend, index) => {
                const Icon = MACRO_ICONS[trend.macro]
                const colors = MACRO_COLORS[trend.macro]
                const TrendIcon = trend.trend === 'rising' ? TrendingUp :
                    trend.trend === 'falling' ? TrendingDown : Minus
                const trendColor = trend.trend === 'stable' ? 'text-muted-foreground' :
                    (trend.macro === 'calories' && trend.trend === 'rising') ? 'text-orange-500' :
                        (trend.macro === 'calories' && trend.trend === 'falling') ? 'text-green-500' :
                            trend.trend === 'rising' ? 'text-green-500' : 'text-red-500'

                const progressPercent = Math.min((trend.current / trend.target) * 100, 100)

                return (
                    <motion.div
                        key={trend.macro}
                        className={cn(
                            "relative overflow-hidden rounded-2xl border bg-card p-4",
                            "hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        )}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        {/* Background gradient decoration */}
                        <div
                            className={cn(
                                "absolute -top-10 -left-10 w-24 h-24 rounded-full opacity-10 blur-2xl",
                                `bg-gradient-to-br ${colors.gradient}`
                            )}
                        />

                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <motion.div
                                className="flex items-center justify-center w-10 h-10 rounded-xl"
                                style={{ backgroundColor: `${colors.primary}15` }}
                                whileHover={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                <Icon className="w-5 h-5" style={{ color: colors.primary }} />
                            </motion.div>

                            <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                                <TrendIcon className="w-3 h-3" />
                                <span>{trend.percentChange > 0 ? '+' : ''}{trend.percentChange.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Label */}
                        <p className="text-xs text-muted-foreground mb-1">{MACRO_LABELS[trend.macro]}</p>

                        {/* Value */}
                        <div className="flex items-baseline gap-1 mb-3">
                            <motion.span
                                className="text-2xl font-bold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                            >
                                {Math.round(trend.current).toLocaleString()}
                            </motion.span>
                            <span className="text-xs text-muted-foreground">
                                / {trend.target.toLocaleString()} {MACRO_UNITS[trend.macro]}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.primary}90)`
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                            />
                        </div>

                        {/* Weekly average badge */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-muted/50">
                            <span className="text-[10px] text-muted-foreground">ממוצע שבועי</span>
                            <span className="text-xs font-medium">
                                {Math.round(trend.weeklyAverage).toLocaleString()} {MACRO_UNITS[trend.macro]}
                            </span>
                        </div>

                        {/* Consistency indicator */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={cn(
                                            "w-1.5 h-4 rounded-full",
                                            i < Math.floor(trend.consistency / 20)
                                                ? `bg-gradient-to-t ${colors.gradient}`
                                                : "bg-muted"
                                        )}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ delay: 0.8 + i * 0.05 }}
                                        style={{ transformOrigin: 'bottom' }}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                                עקביות {trend.consistency}%
                            </span>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
