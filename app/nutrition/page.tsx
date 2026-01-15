"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Apple, Sparkles, UtensilsCrossed, ChevronRight, ChevronLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DailySummary } from "./components/daily-summary"
import { MealCard } from "./components/meal-card"
import { WaterTracker } from "./components/water-tracker"
import { WeightTracker } from "./components/weight-tracker"
import { AddFoodDialog } from "./components/add-food-dialog"
import { GoalsEditDialog } from "./components/goals-edit-dialog"
import type { Meal, WaterLog, WeightLog, NutritionGoals } from "@/lib/types/nutrition"

export default function NutritionPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [meals, setMeals] = useState<Meal[]>([])
    const [waterLogs, setWaterLogs] = useState<WaterLog[]>([])
    const [weightLog, setWeightLog] = useState<WeightLog | null>(null)
    const [goals, setGoals] = useState<NutritionGoals | null>(null)
    const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
    const [isGoalsEditOpen, setIsGoalsEditOpen] = useState(false)
    const [activeMealType, setActiveMealType] = useState<Meal['meal_type']>('breakfast')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch all data for selected date
    useEffect(() => {
        fetchDayData()
    }, [selectedDate])

    async function fetchDayData() {
        setIsLoading(true)
        setError(null)

        try {
            // Fetch meals with items
            const { data: mealsData, error: mealsError } = await supabase
                .from('meals')
                .select(`
                    *,
                    items:meal_items(
                        *,
                        food:foods(*)
                    )
                `)
                .eq('date', selectedDate)

            if (mealsError) throw mealsError
            setMeals(mealsData || [])

            // Fetch water logs
            const { data: waterData, error: waterError } = await supabase
                .from('water_logs')
                .select('*')
                .eq('date', selectedDate)

            if (waterError) throw waterError
            setWaterLogs(waterData || [])

            // Fetch weight log
            const { data: weightData, error: weightError } = await supabase
                .from('weight_logs')
                .select('*')
                .eq('date', selectedDate)
                .single()

            if (weightError && weightError.code !== 'PGRST116') throw weightError
            setWeightLog(weightData || null)

            // Fetch goals
            const { data: goalsData, error: goalsError } = await supabase
                .from('nutrition_goals')
                .select('*')
                .eq('is_active', true)
                .single()

            if (goalsError && goalsError.code !== 'PGRST116') throw goalsError
            setGoals(goalsData || null)

        } catch (err: any) {
            // Check if tables don't exist
            if (err?.code === '42P01') {
                setError('טבלאות התזונה לא נמצאו. אנא הרץ את קובץ ההגירה supabase_migration_nutrition.sql')
            } else {
                setError(err?.message || 'שגיאה בטעינת נתונים')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate daily totals
    const dailyTotals = meals.reduce((acc, meal) => {
        const mealItems = meal.items || []
        mealItems.forEach(item => {
            acc.calories += Number(item.calories) || 0
            acc.protein += Number(item.protein) || 0
            acc.carbs += Number(item.carbs) || 0
            acc.fat += Number(item.fat) || 0
        })
        return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

    const totalWater = waterLogs.reduce((sum, log) => sum + Number(log.amount_ml), 0)

    function handleAddFood(mealType: Meal['meal_type']) {
        setActiveMealType(mealType)
        setIsAddFoodOpen(true)
    }

    function handleDateChange(days: number) {
        const current = new Date(selectedDate)
        current.setDate(current.getDate() + days)
        setSelectedDate(current.toISOString().split('T')[0])
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (dateStr === today.toISOString().split('T')[0]) return 'היום'
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'אתמול'

        return date.toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    if (error) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="glass rounded-3xl p-6 text-center border-red-200/50">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
                        <Apple className="h-7 w-7 text-red-500" />
                    </div>
                    <p className="text-red-600 mb-2 font-medium">{error}</p>
                    <p className="text-sm text-slate-500">
                        Run the migration file in Supabase SQL Editor
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen pb-24 md:pb-8">
            {/* Header */}
            <div className="space-y-4">
                {/* Title Row */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
                            <div className="p-2 rounded-xl gradient-green shadow-lg">
                                <Apple className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <span className="gradient-text">Nutrition</span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-1">Track your meals, macros, and hydration.</p>
                    </div>

                    {/* Action Buttons - Desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/nutrition/foods"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-button text-slate-700 font-medium hover:bg-white/60 transition-all"
                        >
                            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                            <span>המזונות שלי</span>
                        </Link>
                        <Link
                            href="/nutrition-insights"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-purple text-white font-medium shadow-lg shadow-purple-500/25 hover:opacity-90 transition-all"
                        >
                            <Sparkles className="w-5 h-5" />
                            <span>תובנות</span>
                        </Link>
                    </div>
                </div>

                {/* Controls Row - Mobile friendly */}
                <div className="flex items-center justify-between gap-2">
                    {/* Date Selector */}
                    <div className="flex items-center gap-1 sm:gap-2 glass rounded-xl p-1">
                        <button
                            onClick={() => handleDateChange(-1)}
                            className="p-2.5 hover:bg-white/50 rounded-lg transition-colors active:scale-95"
                        >
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </button>
                        <span className="px-3 sm:px-4 py-1.5 font-medium text-slate-700 min-w-[100px] sm:min-w-[140px] text-center text-sm sm:text-base">
                            {formatDate(selectedDate)}
                        </span>
                        <button
                            onClick={() => handleDateChange(1)}
                            className="p-2.5 hover:bg-white/50 rounded-lg transition-colors active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>

                    {/* Action Buttons - Mobile */}
                    <div className="flex md:hidden items-center gap-2">
                        <Link
                            href="/nutrition/foods"
                            className="flex items-center justify-center p-3 rounded-xl glass-button text-slate-700 transition-all active:scale-95"
                        >
                            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                        </Link>
                        <Link
                            href="/nutrition-insights"
                            className="flex items-center justify-center p-3 rounded-xl gradient-purple text-white shadow-lg shadow-purple-500/25 transition-all active:scale-95"
                        >
                            <Sparkles className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <>
                    {/* Daily Summary */}
                    <DailySummary
                        totals={dailyTotals}
                        goals={goals}
                        totalWater={totalWater}
                        onEditGoals={() => setIsGoalsEditOpen(true)}
                    />

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Meals Column */}
                        <div className="lg:col-span-2 space-y-4">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mealType => {
                                const meal = meals.find(m => m.meal_type === mealType)
                                return (
                                    <MealCard
                                        key={mealType}
                                        mealType={mealType}
                                        items={meal?.items || []}
                                        onAddFood={() => handleAddFood(mealType)}
                                        onRefresh={fetchDayData}
                                        date={selectedDate}
                                        mealId={meal?.id}
                                    />
                                )
                            })}
                        </div>

                        {/* Side Column */}
                        <div className="space-y-4">
                            <WaterTracker
                                logs={waterLogs}
                                target={goals?.water_target_ml || 2500}
                                date={selectedDate}
                                onRefresh={fetchDayData}
                            />
                            <WeightTracker
                                log={weightLog}
                                date={selectedDate}
                                onRefresh={fetchDayData}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Add Food Dialog */}
            <AddFoodDialog
                isOpen={isAddFoodOpen}
                onClose={() => setIsAddFoodOpen(false)}
                mealType={activeMealType}
                date={selectedDate}
                onSuccess={fetchDayData}
            />

            {/* Goals Edit Dialog */}
            <GoalsEditDialog
                isOpen={isGoalsEditOpen}
                onClose={() => setIsGoalsEditOpen(false)}
                goals={goals}
                onSuccess={fetchDayData}
            />
        </div>
    )
}
