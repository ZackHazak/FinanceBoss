"use client"

import { Plus, Trash2, ChevronDown } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { MEAL_TYPE_LABELS, MEAL_TYPE_ICONS, type MealItem, type Meal } from "@/lib/types/nutrition"
import { cn } from "@/lib/utils"

interface MealCardProps {
    mealType: Meal['meal_type']
    items: MealItem[]
    onAddFood: () => void
    onRefresh: () => void
    date: string
    mealId?: string
}

const MACRO_COLORS = {
    protein: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    carbs: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    fat: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' }
}

export function MealCard({ mealType, items, onAddFood, onRefresh, date, mealId }: MealCardProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const totalCalories = items.reduce((sum, item) => sum + Number(item.calories), 0)
    const totalProtein = items.reduce((sum, item) => sum + Number(item.protein), 0)
    const totalCarbs = items.reduce((sum, item) => sum + Number(item.carbs), 0)
    const totalFat = items.reduce((sum, item) => sum + Number(item.fat), 0)

    async function handleDeleteItem(itemId: string) {
        setIsDeleting(itemId)
        try {
            const { error } = await supabase
                .from('meal_items')
                .delete()
                .eq('id', itemId)

            if (error) throw error
            onRefresh()
        } catch (err) {
            console.error('Error deleting item:', err)
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <motion.div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            {/* Header */}
            <motion.div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
                whileTap={{ scale: 0.995 }}
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-sm"
                        whileHover={{ scale: 1.05, rotate: [-2, 2, 0] }}
                    >
                        <span className="text-2xl">{MEAL_TYPE_ICONS[mealType]}</span>
                    </motion.div>
                    <div>
                        <h3 className="font-semibold text-slate-900">{MEAL_TYPE_LABELS[mealType]}</h3>
                        <p className="text-sm text-slate-400">
                            {items.length > 0 ? `${items.length} פריטים` : 'לא נוספו פריטים'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {items.length > 0 && (
                        <motion.div
                            className="text-left px-3 py-1.5 rounded-xl bg-orange-50"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <span className="text-lg font-bold text-orange-600">{Math.round(totalCalories)}</span>
                            <span className="text-sm text-orange-400 mr-1">קל׳</span>
                        </motion.div>
                    )}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-1"
                    >
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t overflow-hidden"
                    >
                        {/* Macro Summary */}
                        {items.length > 0 && (
                            <motion.div
                                className="grid grid-cols-3 gap-2 p-3 bg-slate-50/50"
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {[
                                    { label: 'חלבון', value: totalProtein, key: 'protein' },
                                    { label: 'פחמימות', value: totalCarbs, key: 'carbs' },
                                    { label: 'שומן', value: totalFat, key: 'fat' }
                                ].map((macro, index) => (
                                    <motion.div
                                        key={macro.key}
                                        className={cn(
                                            "flex flex-col items-center py-2 px-3 rounded-xl",
                                            MACRO_COLORS[macro.key as keyof typeof MACRO_COLORS].bg
                                        )}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                    >
                                        <span className="text-[10px] text-slate-500 mb-0.5">{macro.label}</span>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            MACRO_COLORS[macro.key as keyof typeof MACRO_COLORS].text
                                        )}>
                                            {Math.round(macro.value)}g
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Items List */}
                        <div className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20, height: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={cn(
                                            "flex items-center justify-between p-3 hover:bg-slate-50/50 transition-all group",
                                            isDeleting === item.id && "opacity-50 bg-red-50"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">
                                                {item.food?.name || item.custom_name || 'פריט'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {item.quantity} x {item.serving_size}{item.serving_unit}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="text-left">
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {Math.round(Number(item.calories))}
                                                </span>
                                                <span className="text-xs text-slate-400 mr-1">קל׳</span>
                                            </div>

                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteItem(item.id)
                                                }}
                                                disabled={isDeleting === item.id}
                                                className={cn(
                                                    "p-2 rounded-xl transition-all",
                                                    "text-slate-300 hover:text-red-500 hover:bg-red-50",
                                                    "opacity-0 group-hover:opacity-100",
                                                    "disabled:opacity-50"
                                                )}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Empty state */}
                        {items.length === 0 && (
                            <motion.div
                                className="py-8 text-center text-slate-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <span className="text-3xl mb-2 block">{MEAL_TYPE_ICONS[mealType]}</span>
                                <p className="text-sm">עדיין לא נוספו פריטים</p>
                            </motion.div>
                        )}

                        {/* Add Button */}
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation()
                                onAddFood()
                            }}
                            className="w-full p-3.5 flex items-center justify-center gap-2 text-green-600 hover:bg-green-50 transition-all border-t group"
                            whileHover={{ backgroundColor: 'rgb(240 253 244)' }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <motion.div
                                className="p-1 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors"
                                whileHover={{ rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Plus className="h-4 w-4" />
                            </motion.div>
                            <span className="text-sm font-medium">הוסף מזון</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
