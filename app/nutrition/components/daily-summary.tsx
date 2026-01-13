"use client"

import { motion } from "framer-motion"
import { Flame, Beef, Wheat, Droplet, TrendingUp, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NutritionGoals } from "@/lib/types/nutrition"

interface DailySummaryProps {
    totals: {
        calories: number
        protein: number
        carbs: number
        fat: number
    }
    goals: NutritionGoals | null
    totalWater: number
}

export function DailySummary({ totals, goals, totalWater }: DailySummaryProps) {
    const defaultGoals = {
        calories_target: 2000,
        protein_target: 150,
        carbs_target: 200,
        fat_target: 65,
        water_target_ml: 2500
    }

    const targets = goals || defaultGoals

    const macros = [
        {
            label: 'קלוריות',
            value: Math.round(totals.calories),
            target: targets.calories_target,
            unit: '',
            gradient: 'from-orange-500 to-amber-400',
            bgGradient: 'from-orange-50 to-amber-50',
            ring: 'ring-orange-500/20',
            icon: Flame,
            iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
            textColor: 'text-orange-600'
        },
        {
            label: 'חלבון',
            value: Math.round(totals.protein),
            target: targets.protein_target,
            unit: 'g',
            gradient: 'from-red-500 to-rose-400',
            bgGradient: 'from-red-50 to-rose-50',
            ring: 'ring-red-500/20',
            icon: Beef,
            iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
            textColor: 'text-red-600'
        },
        {
            label: 'פחמימות',
            value: Math.round(totals.carbs),
            target: targets.carbs_target,
            unit: 'g',
            gradient: 'from-amber-500 to-yellow-400',
            bgGradient: 'from-amber-50 to-yellow-50',
            ring: 'ring-amber-500/20',
            icon: Wheat,
            iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-500',
            textColor: 'text-amber-600'
        },
        {
            label: 'שומן',
            value: Math.round(totals.fat),
            target: targets.fat_target,
            unit: 'g',
            gradient: 'from-yellow-500 to-lime-400',
            bgGradient: 'from-yellow-50 to-lime-50',
            ring: 'ring-yellow-500/20',
            icon: Droplet,
            iconBg: 'bg-gradient-to-br from-yellow-500 to-lime-500',
            textColor: 'text-yellow-600'
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {macros.map((macro, index) => {
                const percentage = Math.min((macro.value / macro.target) * 100, 100)
                const isOver = macro.value > macro.target
                const isComplete = percentage >= 100 && !isOver
                const Icon = macro.icon

                return (
                    <motion.div
                        key={macro.label}
                        className={cn(
                            "relative overflow-hidden bg-white rounded-2xl border shadow-sm p-3 md:p-4",
                            "hover:shadow-md transition-shadow"
                        )}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                    >
                        {/* Background gradient decoration */}
                        <div className={cn(
                            "absolute -top-8 -left-8 w-20 h-20 rounded-full opacity-50 blur-2xl",
                            `bg-gradient-to-br ${macro.bgGradient}`
                        )} />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-3 relative">
                            <span className="text-xs md:text-sm font-medium text-slate-500">{macro.label}</span>
                            <motion.div
                                className={cn("p-1.5 rounded-lg shadow-sm", macro.iconBg)}
                                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                            >
                                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                            </motion.div>
                        </div>

                        {/* Value */}
                        <div className="flex items-baseline gap-1 mb-3 relative">
                            <motion.span
                                className={cn(
                                    "text-xl md:text-2xl font-bold",
                                    isOver ? 'text-red-600' : 'text-slate-900'
                                )}
                                key={macro.value}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                            >
                                {macro.value.toLocaleString()}
                            </motion.span>
                            <span className="text-xs md:text-sm text-slate-400">
                                / {macro.target.toLocaleString()}{macro.unit}
                            </span>
                        </div>

                        {/* Modern Progress Bar */}
                        <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            {/* Animated gradient progress */}
                            <motion.div
                                className={cn(
                                    "absolute inset-y-0 left-0 rounded-full",
                                    isOver
                                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                                        : `bg-gradient-to-r ${macro.gradient}`
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.1 }}
                            />
                            {/* Shine effect */}
                            <motion.div
                                className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                initial={{ x: -40 }}
                                animate={{ x: 200 }}
                                transition={{ duration: 1.5, delay: 0.8 + index * 0.1, repeat: Infinity, repeatDelay: 3 }}
                            />
                        </div>

                        {/* Footer with percentage */}
                        <div className="mt-2 flex items-center justify-between">
                            <motion.span
                                className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    isOver
                                        ? "bg-red-100 text-red-600"
                                        : isComplete
                                            ? "bg-green-100 text-green-600"
                                            : "bg-slate-100 text-slate-500"
                                )}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                            >
                                {Math.round(percentage)}%
                            </motion.span>

                            {/* Status indicator */}
                            {isComplete && (
                                <motion.div
                                    className="flex items-center gap-1 text-green-500"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Check className="h-3 w-3" />
                                    <span className="text-[10px] font-medium">הושג!</span>
                                </motion.div>
                            )}
                            {isOver && (
                                <motion.div
                                    className="flex items-center gap-1 text-red-500"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <TrendingUp className="h-3 w-3" />
                                    <span className="text-[10px] font-medium">מעל היעד</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Goal reached celebration effect */}
                        {isComplete && (
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.5, 0] }}
                                transition={{ duration: 1, delay: 0.3 }}
                            >
                                <div className={cn("absolute inset-0 ring-2 rounded-2xl", macro.ring)} />
                            </motion.div>
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}
