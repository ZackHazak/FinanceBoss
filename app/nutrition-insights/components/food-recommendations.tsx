"use client"

import { motion, AnimatePresence } from "framer-motion"
import { FoodRecommendation, MACRO_COLORS } from "@/lib/types/nutrition-insights"
import { cn } from "@/lib/utils"
import { Plus, Sparkles, ChevronLeft, Zap } from "lucide-react"
import { useState } from "react"

interface FoodRecommendationsProps {
    recommendations: FoodRecommendation[]
    onAddFood?: (food: FoodRecommendation) => void
}

const BOOST_LABELS = {
    protein: 'עשיר בחלבון',
    carbs: 'מקור פחמימות',
    fat: 'שומנים בריאים',
    balanced: 'מאוזן'
}

export function FoodRecommendations({ recommendations, onAddFood }: FoodRecommendationsProps) {
    const [selectedFood, setSelectedFood] = useState<string | null>(null)

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    >
                        <Zap className="w-4 h-4 text-white" />
                    </motion.div>
                    <div>
                        <h3 className="text-lg font-semibold">המלצות חכמות</h3>
                        <p className="text-xs text-muted-foreground">מאכלים שישלימו את היעדים שלך</p>
                    </div>
                </div>
            </div>

            {/* Recommendations grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                    {recommendations.map((food, index) => {
                        const boostColor = MACRO_COLORS[food.macroBoost === 'balanced' ? 'calories' : food.macroBoost]
                        const isSelected = selectedFood === food.id

                        return (
                            <motion.div
                                key={food.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.08, duration: 0.3 }}
                                className={cn(
                                    "relative overflow-hidden rounded-2xl border bg-card p-4",
                                    "hover:shadow-lg transition-all duration-300 cursor-pointer group",
                                    isSelected && "ring-2 ring-primary ring-offset-2"
                                )}
                                onClick={() => setSelectedFood(isSelected ? null : food.id)}
                            >
                                {/* Gradient blob decoration */}
                                <motion.div
                                    className="absolute -top-8 -left-8 w-20 h-20 rounded-full opacity-20 blur-2xl"
                                    style={{ backgroundColor: boostColor.primary }}
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.2, 0.3, 0.2]
                                    }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                />

                                {/* Food emoji and info */}
                                <div className="flex items-start gap-3">
                                    <motion.div
                                        className="text-4xl"
                                        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {food.imageEmoji}
                                    </motion.div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-sm truncate">{food.nameHe}</h4>
                                            <span
                                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: `${boostColor.primary}15`,
                                                    color: boostColor.primary
                                                }}
                                            >
                                                {BOOST_LABELS[food.macroBoost]}
                                            </span>
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                            {food.reason}
                                        </p>

                                        {/* Macro badges */}
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600">
                                                {food.calories} קק"ל
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                                                {food.protein}g חלבון
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
                                                {food.carbs}g פחמ'
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-600">
                                                {food.fat}g שומן
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                {isSelected && food.tags.length > 0 && (
                                    <motion.div
                                        className="flex flex-wrap gap-1 mt-3 pt-3 border-t"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        {food.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Add button */}
                                <motion.button
                                    className={cn(
                                        "absolute bottom-3 left-3 p-2 rounded-xl",
                                        "bg-gradient-to-br from-green-500 to-emerald-500",
                                        "text-white shadow-lg shadow-green-500/25",
                                        "opacity-0 group-hover:opacity-100 transition-opacity"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAddFood?.(food)
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Plus className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Empty state */}
            {recommendations.length === 0 && (
                <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                        המלצות יופיעו כאן בהתאם לצריכה היומית שלך
                    </p>
                </motion.div>
            )}
        </div>
    )
}
