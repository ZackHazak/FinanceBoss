"use client"

import { motion } from "framer-motion"
import { WeeklyDataPoint, MACRO_COLORS, DAY_NAMES_HE } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { useState } from "react"

interface WeeklyChartProps {
    data: WeeklyDataPoint[]
    targetCalories: number
}

type ViewMode = 'calories' | 'macros' | 'all'

export function WeeklyChart({ data, targetCalories }: WeeklyChartProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('calories')
    const [hoveredDay, setHoveredDay] = useState<number | null>(null)

    const maxCalories = Math.max(...data.map(d => d.calories), targetCalories) * 1.1
    const maxMacro = Math.max(
        ...data.map(d => Math.max(d.protein, d.carbs, d.fat))
    ) * 1.1

    const getBarHeight = (value: number, max: number) => {
        return Math.max((value / max) * 100, 2)
    }

    return (
        <div className="rounded-2xl border bg-card p-4 md:p-6">
            {/* Header with view toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-lg font-semibold">מגמות שבועיות</h3>
                    <p className="text-sm text-muted-foreground">סקירה של 7 הימים האחרונים</p>
                </div>

                {/* Modern segmented control */}
                <div className="flex p-1 rounded-xl bg-muted/50">
                    {[
                        { key: 'calories', label: 'קלוריות' },
                        { key: 'macros', label: 'מאקרו' },
                        { key: 'all', label: 'הכל' }
                    ].map((mode) => (
                        <button
                            key={mode.key}
                            onClick={() => setViewMode(mode.key as ViewMode)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                                viewMode === mode.key
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-48 md:h-64">
                {/* Target line */}
                {viewMode !== 'macros' && (
                    <motion.div
                        className="absolute left-0 right-0 border-t-2 border-dashed border-orange-300/50"
                        style={{ bottom: `${getBarHeight(targetCalories, maxCalories)}%` }}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <span className="absolute -top-4 left-2 text-[10px] text-orange-500 font-medium">
                            יעד {targetCalories.toLocaleString()}
                        </span>
                    </motion.div>
                )}

                {/* Bars */}
                <div className="flex items-end justify-around h-full gap-1 sm:gap-2 md:gap-4">
                    {data.map((day, index) => {
                        const isHovered = hoveredDay === index
                        const dayNameHe = DAY_NAMES_HE[day.dayName as keyof typeof DAY_NAMES_HE] || day.dayName

                        return (
                            <div
                                key={day.date}
                                className="flex-1 flex flex-col items-center gap-2"
                                onMouseEnter={() => setHoveredDay(index)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                {/* Bars container */}
                                <div className="relative w-full h-full flex items-end justify-center gap-0.5">
                                    {/* Calories bar */}
                                    {(viewMode === 'calories' || viewMode === 'all') && (
                                        <motion.div
                                            className={cn(
                                                "relative rounded-t-lg transition-all",
                                                viewMode === 'all' ? "w-2 sm:w-3" : "w-6 sm:w-10"
                                            )}
                                            style={{
                                                background: `linear-gradient(to top, ${MACRO_COLORS.calories.primary}, ${MACRO_COLORS.calories.primary}90)`,
                                                boxShadow: isHovered ? `0 0 20px ${MACRO_COLORS.calories.primary}40` : 'none'
                                            }}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${getBarHeight(day.calories, maxCalories)}%` }}
                                            transition={{ delay: 0.1 * index, duration: 0.6, ease: "easeOut" }}
                                            whileHover={{ scale: 1.05 }}
                                        />
                                    )}

                                    {/* Macro bars */}
                                    {(viewMode === 'macros' || viewMode === 'all') && (
                                        <>
                                            <motion.div
                                                className="w-2 sm:w-3 rounded-t-lg"
                                                style={{
                                                    background: `linear-gradient(to top, ${MACRO_COLORS.protein.primary}, ${MACRO_COLORS.protein.primary}80)`
                                                }}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${getBarHeight(day.protein, maxMacro)}%` }}
                                                transition={{ delay: 0.1 * index + 0.1, duration: 0.6 }}
                                            />
                                            <motion.div
                                                className="w-2 sm:w-3 rounded-t-lg"
                                                style={{
                                                    background: `linear-gradient(to top, ${MACRO_COLORS.carbs.primary}, ${MACRO_COLORS.carbs.primary}80)`
                                                }}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${getBarHeight(day.carbs, maxMacro)}%` }}
                                                transition={{ delay: 0.1 * index + 0.15, duration: 0.6 }}
                                            />
                                            <motion.div
                                                className="w-2 sm:w-3 rounded-t-lg"
                                                style={{
                                                    background: `linear-gradient(to top, ${MACRO_COLORS.fat.primary}, ${MACRO_COLORS.fat.primary}80)`
                                                }}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${getBarHeight(day.fat, maxMacro)}%` }}
                                                transition={{ delay: 0.1 * index + 0.2, duration: 0.6 }}
                                            />
                                        </>
                                    )}

                                    {/* Hover tooltip */}
                                    {isHovered && (
                                        <motion.div
                                            className="absolute -top-20 left-1/2 -translate-x-1/2 z-10 min-w-[120px]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="bg-popover border rounded-xl p-3 shadow-xl">
                                                <div className="text-xs font-medium mb-2">{dayNameHe}</div>
                                                <div className="space-y-1 text-[10px]">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-muted-foreground">קלוריות</span>
                                                        <span className="font-medium">{day.calories}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-muted-foreground">חלבון</span>
                                                        <span className="font-medium">{day.protein}g</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-muted-foreground">פחמימות</span>
                                                        <span className="font-medium">{day.carbs}g</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-muted-foreground">שומן</span>
                                                        <span className="font-medium">{day.fat}g</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-3 h-3 bg-popover border-l border-b rotate-[-45deg] mx-auto -mt-1.5" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Day label */}
                                <div className="text-center">
                                    <div className={cn(
                                        "text-[10px] sm:text-xs font-medium transition-colors",
                                        isHovered ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {dayNameHe.slice(0, 2)}
                                    </div>
                                    {/* Goal achieved indicator */}
                                    <motion.div
                                        className={cn(
                                            "w-4 h-4 rounded-full mx-auto mt-1 flex items-center justify-center",
                                            day.goalAchieved ? "bg-green-100" : "bg-red-50"
                                        )}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.8 + index * 0.05 }}
                                    >
                                        {day.goalAchieved ? (
                                            <Check className="w-2.5 h-2.5 text-green-600" />
                                        ) : (
                                            <X className="w-2.5 h-2.5 text-red-400" />
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Legend */}
            {viewMode !== 'calories' && (
                <motion.div
                    className="flex items-center justify-center gap-4 mt-4 pt-4 border-t"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    {viewMode === 'all' && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: MACRO_COLORS.calories.primary }} />
                            <span className="text-[10px] text-muted-foreground">קלוריות</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: MACRO_COLORS.protein.primary }} />
                        <span className="text-[10px] text-muted-foreground">חלבון</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: MACRO_COLORS.carbs.primary }} />
                        <span className="text-[10px] text-muted-foreground">פחמימות</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: MACRO_COLORS.fat.primary }} />
                        <span className="text-[10px] text-muted-foreground">שומן</span>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
