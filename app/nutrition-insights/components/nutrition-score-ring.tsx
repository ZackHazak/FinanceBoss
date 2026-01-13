"use client"

import { motion } from "framer-motion"
import { NutritionScore, GRADE_COLORS } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import { TrendingUp, Target, Droplets, Activity, Flame } from "lucide-react"

interface NutritionScoreRingProps {
    score: NutritionScore
    size?: 'sm' | 'md' | 'lg'
    showBreakdown?: boolean
}

export function NutritionScoreRing({ score, size = 'lg', showBreakdown = true }: NutritionScoreRingProps) {
    const sizes = {
        sm: { ring: 80, stroke: 6, text: 'text-xl' },
        md: { ring: 120, stroke: 8, text: 'text-3xl' },
        lg: { ring: 180, stroke: 12, text: 'text-5xl' }
    }

    const { ring: ringSize, stroke: strokeWidth, text: textSize } = sizes[size]
    const radius = (ringSize - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score.overall / 100) * circumference

    const breakdownItems = [
        { key: 'calorieAccuracy', label: 'דיוק קלוריות', icon: Flame, value: score.breakdown.calorieAccuracy },
        { key: 'proteinGoal', label: 'יעד חלבון', icon: Target, value: score.breakdown.proteinGoal },
        { key: 'macroBalance', label: 'איזון מאקרו', icon: Activity, value: score.breakdown.macroBalance },
        { key: 'consistency', label: 'עקביות', icon: TrendingUp, value: score.breakdown.consistency },
        { key: 'hydration', label: 'הידרציה', icon: Droplets, value: score.breakdown.hydration },
    ]

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Main Score Ring */}
            <div className="relative" style={{ width: ringSize, height: ringSize }}>
                {/* Background ring with gradient */}
                <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${ringSize} ${ringSize}`}>
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={GRADE_COLORS[score.grade]} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={GRADE_COLORS[score.grade]} stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth={strokeWidth}
                        className="opacity-30"
                    />
                </svg>

                {/* Animated progress ring */}
                <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${ringSize} ${ringSize}`}>
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={GRADE_COLORS[score.grade]} />
                            <stop offset="50%" stopColor={GRADE_COLORS[score.grade]} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={GRADE_COLORS[score.grade]} stopOpacity="0.6" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <motion.circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        filter="url(#glow)"
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        className={cn(textSize, "font-bold")}
                        style={{ color: GRADE_COLORS[score.grade] }}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        {score.grade}
                    </motion.span>
                    <motion.span
                        className="text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        {score.overall}/100
                    </motion.span>
                </div>

                {/* Decorative dots around the ring */}
                {size === 'lg' && (
                    <div className="absolute inset-0">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1.5 h-1.5 rounded-full bg-muted-foreground/20"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: `rotate(${i * 30}deg) translateY(-${ringSize / 2 + 10}px) translateX(-50%)`,
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * i }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Score Breakdown */}
            {showBreakdown && (
                <motion.div
                    className="w-full max-w-sm space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    {breakdownItems.map((item, index) => (
                        <motion.div
                            key={item.key}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 + index * 0.1 }}
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50">
                                <item.icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">{item.label}</span>
                                    <span className="text-xs font-medium">{item.value}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{
                                            background: `linear-gradient(90deg, ${GRADE_COLORS[score.grade]}, ${GRADE_COLORS[score.grade]}80)`
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
