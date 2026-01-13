"use client"

import { motion } from "framer-motion"
import { MacroDistribution, MACRO_COLORS } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface MacroDonutProps {
    distribution: MacroDistribution
    size?: number
}

export function MacroDonut({ distribution, size = 200 }: MacroDonutProps) {
    const [hoveredMacro, setHoveredMacro] = useState<'protein' | 'carbs' | 'fat' | null>(null)

    const total = distribution.protein.calories + distribution.carbs.calories + distribution.fat.calories
    const radius = (size - 40) / 2
    const circumference = 2 * Math.PI * radius
    const strokeWidth = 24

    // Calculate stroke dash offsets for each segment
    const proteinPerc = distribution.protein.percentage
    const carbsPerc = distribution.carbs.percentage
    const fatPerc = distribution.fat.percentage

    const proteinOffset = 0
    const carbsOffset = proteinPerc
    const fatOffset = proteinPerc + carbsPerc

    const segments = [
        { key: 'protein', label: 'חלבון', offset: proteinOffset, percent: proteinPerc, data: distribution.protein, color: MACRO_COLORS.protein.primary },
        { key: 'carbs', label: 'פחמימות', offset: carbsOffset, percent: carbsPerc, data: distribution.carbs, color: MACRO_COLORS.carbs.primary },
        { key: 'fat', label: 'שומן', offset: fatOffset, percent: fatPerc, data: distribution.fat, color: MACRO_COLORS.fat.primary },
    ] as const

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Donut Chart */}
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth={strokeWidth}
                        className="opacity-20"
                    />

                    {/* Macro segments */}
                    {segments.map((segment, index) => {
                        const dashArray = (segment.percent / 100) * circumference
                        const dashOffset = -(segment.offset / 100) * circumference
                        const isHovered = hoveredMacro === segment.key

                        return (
                            <motion.circle
                                key={segment.key}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                                strokeDasharray={`${dashArray} ${circumference}`}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="butt"
                                initial={{ strokeDasharray: `0 ${circumference}` }}
                                animate={{
                                    strokeDasharray: `${dashArray} ${circumference}`,
                                    strokeWidth: isHovered ? strokeWidth + 4 : strokeWidth
                                }}
                                transition={{
                                    delay: 0.2 + index * 0.15,
                                    duration: 0.8,
                                    ease: "easeOut"
                                }}
                                className="cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredMacro(segment.key)}
                                onMouseLeave={() => setHoveredMacro(null)}
                                style={{
                                    filter: isHovered ? `drop-shadow(0 0 10px ${segment.color}60)` : 'none'
                                }}
                            />
                        )
                    })}

                    {/* Inner decorative ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius - strokeWidth / 2 - 8}
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        className="opacity-30"
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        {hoveredMacro ? (
                            <>
                                <span className="text-3xl font-bold" style={{ color: MACRO_COLORS[hoveredMacro].primary }}>
                                    {segments.find(s => s.key === hoveredMacro)?.data.grams}g
                                </span>
                                <p className="text-sm text-muted-foreground">
                                    {segments.find(s => s.key === hoveredMacro)?.label}
                                </p>
                            </>
                        ) : (
                            <>
                                <span className="text-3xl font-bold">{total}</span>
                                <p className="text-sm text-muted-foreground">קק"ל</p>
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Floating labels */}
                {segments.map((segment, index) => {
                    const angle = ((segment.offset + segment.percent / 2) / 100) * 360 - 90
                    const labelRadius = radius + 30
                    const x = size / 2 + labelRadius * Math.cos((angle * Math.PI) / 180)
                    const y = size / 2 + labelRadius * Math.sin((angle * Math.PI) / 180)

                    return (
                        <motion.div
                            key={`label-${segment.key}`}
                            className={cn(
                                "absolute text-xs font-medium px-2 py-1 rounded-lg bg-card border shadow-sm",
                                "opacity-0 pointer-events-none",
                                hoveredMacro === segment.key && "opacity-100"
                            )}
                            style={{
                                left: x,
                                top: y,
                                transform: 'translate(-50%, -50%)',
                                color: segment.color
                            }}
                            animate={{ opacity: hoveredMacro === segment.key ? 1 : 0 }}
                        >
                            {segment.percent.toFixed(0)}%
                        </motion.div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4">
                {segments.map((segment, index) => (
                    <motion.div
                        key={segment.key}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                            hoveredMacro === segment.key ? "bg-muted shadow-sm" : "hover:bg-muted/50"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        onMouseEnter={() => setHoveredMacro(segment.key)}
                        onMouseLeave={() => setHoveredMacro(null)}
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: segment.color }}
                        />
                        <div className="text-xs">
                            <span className="font-medium">{segment.label}</span>
                            <span className="text-muted-foreground mr-1">
                                {segment.data.grams}g ({segment.percent.toFixed(0)}%)
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
