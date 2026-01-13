"use client"

import { motion } from "framer-motion"
import { StreakData } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import { Flame, Droplets, Target, Calendar, Zap, Trophy } from "lucide-react"

interface StreakBadgesProps {
    streaks: StreakData[]
}

const STREAK_CONFIG = {
    calories: {
        icon: Flame,
        label: 'יעד קלוריות',
        gradient: 'from-orange-500 to-red-500',
        bgGradient: 'from-orange-500/10 to-red-500/10'
    },
    protein: {
        icon: Target,
        label: 'יעד חלבון',
        gradient: 'from-red-500 to-pink-500',
        bgGradient: 'from-red-500/10 to-pink-500/10'
    },
    water: {
        icon: Droplets,
        label: 'שתייה',
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-500/10 to-cyan-500/10'
    },
    logging: {
        icon: Calendar,
        label: 'תיעוד רצוף',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-500/10 to-pink-500/10'
    }
}

export function StreakBadges({ streaks }: StreakBadgesProps) {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <motion.div
                    className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Zap className="w-4 h-4 text-white" />
                </motion.div>
                <div>
                    <h3 className="text-lg font-semibold">רצפים</h3>
                    <p className="text-xs text-muted-foreground">שמור על העקביות שלך</p>
                </div>
            </div>

            {/* Streaks grid */}
            <div className="grid grid-cols-2 gap-3">
                {streaks.map((streak, index) => {
                    const config = STREAK_CONFIG[streak.streakType]
                    const Icon = config.icon
                    const isActive = streak.currentStreak > 0
                    const isRecord = streak.currentStreak >= streak.longestStreak && streak.currentStreak > 0

                    return (
                        <motion.div
                            key={streak.streakType}
                            className={cn(
                                "relative overflow-hidden rounded-2xl border p-4",
                                "bg-gradient-to-br",
                                config.bgGradient
                            )}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            {/* Record badge */}
                            {isRecord && (
                                <motion.div
                                    className="absolute top-2 left-2"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                                >
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold shadow-lg">
                                        <Trophy className="w-3 h-3" />
                                        שיא!
                                    </div>
                                </motion.div>
                            )}

                            {/* Icon */}
                            <motion.div
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                                    "bg-gradient-to-br",
                                    config.gradient,
                                    !isActive && "opacity-30"
                                )}
                                animate={isActive ? {
                                    boxShadow: [
                                        "0 0 0 0 rgba(255,255,255,0)",
                                        "0 0 20px 5px rgba(255,255,255,0.3)",
                                        "0 0 0 0 rgba(255,255,255,0)"
                                    ]
                                } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <Icon className="w-6 h-6 text-white" />
                            </motion.div>

                            {/* Streak count */}
                            <div className="flex items-baseline gap-1 mb-1">
                                <motion.span
                                    className={cn(
                                        "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                                        config.gradient
                                    )}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                >
                                    {streak.currentStreak}
                                </motion.span>
                                <span className="text-sm text-muted-foreground">ימים</span>
                            </div>

                            {/* Label */}
                            <p className="text-xs text-muted-foreground mb-2">{config.label}</p>

                            {/* Flame indicators */}
                            <div className="flex gap-0.5">
                                {[...Array(7)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className={cn(
                                            "w-2 h-4 rounded-full",
                                            i < streak.currentStreak
                                                ? `bg-gradient-to-t ${config.gradient}`
                                                : "bg-muted"
                                        )}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                                        style={{ transformOrigin: 'bottom' }}
                                    />
                                ))}
                            </div>

                            {/* Best streak */}
                            <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">שיא אישי</span>
                                <span className="text-xs font-medium">{streak.longestStreak} ימים</span>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Motivational message */}
            {streaks.some(s => s.currentStreak > 0) && (
                <motion.div
                    className="text-center py-3 px-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    <p className="text-sm text-green-700 font-medium">
                        🔥 אתה ברצף מעולה! המשך כך!
                    </p>
                </motion.div>
            )}
        </div>
    )
}
