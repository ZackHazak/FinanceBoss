"use client"

import { motion, AnimatePresence } from "framer-motion"
import { MealInsight, INSIGHT_TYPE_LABELS } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import {
    Lightbulb,
    AlertTriangle,
    Trophy,
    Sparkles,
    ChevronLeft,
    X
} from "lucide-react"
import { useState } from "react"

interface InsightsCardsProps {
    insights: MealInsight[]
    maxVisible?: number
}

const INSIGHT_STYLES = {
    tip: {
        icon: Lightbulb,
        gradient: 'from-blue-500 to-cyan-400',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconColor: 'text-blue-500'
    },
    warning: {
        icon: AlertTriangle,
        gradient: 'from-amber-500 to-orange-400',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        iconColor: 'text-amber-500'
    },
    achievement: {
        icon: Trophy,
        gradient: 'from-green-500 to-emerald-400',
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconColor: 'text-green-500'
    },
    suggestion: {
        icon: Sparkles,
        gradient: 'from-purple-500 to-pink-400',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        iconColor: 'text-purple-500'
    }
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

export function InsightsCards({ insights, maxVisible = 4 }: InsightsCardsProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    // Sort by priority and filter dismissed
    const sortedInsights = insights
        .filter(i => !dismissedIds.has(i.id))
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        .slice(0, maxVisible)

    const handleDismiss = (id: string) => {
        setDismissedIds(new Set([...dismissedIds, id]))
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        תובנות חכמות
                    </h3>
                    <p className="text-sm text-muted-foreground">המלצות מותאמות אישית</p>
                </div>
                {insights.length > maxVisible && (
                    <button className="text-sm text-primary hover:underline flex items-center gap-1">
                        הצג הכל ({insights.length})
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                    {sortedInsights.map((insight, index) => {
                        const style = INSIGHT_STYLES[insight.type]
                        const Icon = style.icon
                        const isExpanded = expandedId === insight.id

                        return (
                            <motion.div
                                key={insight.id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, x: 100 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                className={cn(
                                    "relative overflow-hidden rounded-2xl border p-4 cursor-pointer",
                                    "hover:shadow-md transition-all duration-300",
                                    style.bg,
                                    style.border,
                                    isExpanded && "ring-2 ring-offset-2 ring-primary"
                                )}
                                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                            >
                                {/* Priority indicator */}
                                {insight.priority === 'high' && (
                                    <motion.div
                                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-400"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 0.3 }}
                                    />
                                )}

                                {/* Dismiss button */}
                                <motion.button
                                    className="absolute top-2 left-2 p-1 rounded-full hover:bg-black/5 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDismiss(insight.id)
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </motion.button>

                                <div className="flex gap-3">
                                    {/* Icon with gradient background */}
                                    <motion.div
                                        className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                                            `bg-gradient-to-br ${style.gradient}`
                                        )}
                                        whileHover={{ rotate: [0, -10, 10, 0] }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Icon className="w-5 h-5 text-white" />
                                    </motion.div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5">
                                                {INSIGHT_TYPE_LABELS[insight.type]}
                                            </span>
                                            {insight.icon && (
                                                <span className="text-sm">{insight.icon}</span>
                                            )}
                                        </div>

                                        <h4 className="font-medium text-sm mb-1 leading-snug">
                                            {insight.title}
                                        </h4>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <p className="text-xs text-muted-foreground mb-3">
                                                        {insight.description}
                                                    </p>

                                                    {insight.actionable && insight.action && (
                                                        <motion.button
                                                            className={cn(
                                                                "text-xs font-medium px-3 py-1.5 rounded-lg",
                                                                "bg-white shadow-sm hover:shadow-md transition-shadow",
                                                                style.iconColor
                                                            )}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            {insight.action}
                                                        </motion.button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {!isExpanded && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {insight.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Expand indicator */}
                                <motion.div
                                    className="absolute bottom-2 left-1/2 -translate-x-1/2"
                                    animate={{ y: [0, 3, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    <div className={cn(
                                        "w-8 h-1 rounded-full bg-black/10",
                                        isExpanded && "bg-black/20"
                                    )} />
                                </motion.div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {sortedInsights.length === 0 && (
                <motion.div
                    className="text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">אין תובנות חדשות כרגע</p>
                    <p className="text-xs">המשך לתעד את הארוחות שלך לקבלת המלצות</p>
                </motion.div>
            )}
        </div>
    )
}
