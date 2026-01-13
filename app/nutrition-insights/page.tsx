"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import {
    NutritionInsightsData,
    WeeklyDataPoint,
    MacroTrend,
    NutritionScore,
    MealInsight,
    FoodRecommendation,
    StreakData,
    WeeklySummary,
    MacroDistribution,
    DAY_NAMES_HE,
    GRADE_COLORS
} from "@/lib/types/nutrition-insights"
import { NutritionScoreRing } from "./components/nutrition-score-ring"
import { MacroTrendCards } from "./components/macro-trend-cards"
import { WeeklyChart } from "./components/weekly-chart"
import { InsightsCards } from "./components/insights-cards"
import { MacroDonut } from "./components/macro-donut"
import { FoodRecommendations } from "./components/food-recommendations"
import { StreakBadges } from "./components/streak-badges"
import { WeeklySummaryCard } from "./components/weekly-summary-card"
import {
    ChevronRight,
    Sparkles,
    RefreshCw,
    TrendingUp,
    BarChart3,
    Loader2
} from "lucide-react"
import Link from "next/link"

export default function NutritionInsightsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [insightsData, setInsightsData] = useState<NutritionInsightsData | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'recommendations'>('overview')

    useEffect(() => {
        loadInsightsData()
    }, [])

    const loadInsightsData = async () => {
        setIsLoading(true)
        try {
            // Fetch last 7 days of data
            const today = new Date()
            const weekAgo = new Date(today)
            weekAgo.setDate(weekAgo.getDate() - 6)

            const startDate = weekAgo.toISOString().split('T')[0]
            const endDate = today.toISOString().split('T')[0]

            // Fetch meals with items
            const { data: meals } = await supabase
                .from('meals')
                .select(`
                    id,
                    date,
                    meal_type,
                    meal_items (
                        calories,
                        protein,
                        carbs,
                        fat
                    )
                `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true })

            // Fetch goals
            const { data: goals } = await supabase
                .from('nutrition_goals')
                .select('*')
                .eq('is_active', true)
                .single()

            // Fetch water logs
            const { data: waterLogs } = await supabase
                .from('water_logs')
                .select('date, amount_ml')
                .gte('date', startDate)
                .lte('date', endDate)

            // Process the data
            const processedData = processNutritionData(meals || [], goals, waterLogs || [], startDate, endDate)
            setInsightsData(processedData)
        } catch (error) {
            console.error('Error loading insights:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const processNutritionData = (
        meals: any[],
        goals: any,
        waterLogs: any[],
        startDate: string,
        endDate: string
    ): NutritionInsightsData => {
        const targetCalories = goals?.calories_target || 2000
        const targetProtein = goals?.protein_target || 150
        const targetCarbs = goals?.carbs_target || 200
        const targetFat = goals?.fat_target || 65
        const targetWater = goals?.water_target_ml || 2500

        // Group meals by date
        const dailyData: Record<string, { calories: number; protein: number; carbs: number; fat: number; water: number }> = {}

        // Initialize all days
        const start = new Date(startDate)
        const end = new Date(endDate)
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]
            dailyData[dateStr] = { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
        }

        // Aggregate meal data
        meals.forEach(meal => {
            const items = meal.meal_items || []
            items.forEach((item: any) => {
                if (dailyData[meal.date]) {
                    dailyData[meal.date].calories += item.calories || 0
                    dailyData[meal.date].protein += item.protein || 0
                    dailyData[meal.date].carbs += item.carbs || 0
                    dailyData[meal.date].fat += item.fat || 0
                }
            })
        })

        // Add water data
        waterLogs.forEach(log => {
            if (dailyData[log.date]) {
                dailyData[log.date].water += log.amount_ml || 0
            }
        })

        // Create weekly data points
        const weeklyData: WeeklyDataPoint[] = Object.entries(dailyData).map(([date, data]) => {
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
            return {
                date,
                dayName: dayOfWeek,
                calories: Math.round(data.calories),
                protein: Math.round(data.protein),
                carbs: Math.round(data.carbs),
                fat: Math.round(data.fat),
                water: Math.round(data.water),
                goalAchieved: data.calories >= targetCalories * 0.9 && data.calories <= targetCalories * 1.1
            }
        })

        // Calculate averages
        const avgCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0) / 7
        const avgProtein = weeklyData.reduce((sum, d) => sum + d.protein, 0) / 7
        const avgCarbs = weeklyData.reduce((sum, d) => sum + d.carbs, 0) / 7
        const avgFat = weeklyData.reduce((sum, d) => sum + d.fat, 0) / 7
        const avgWater = weeklyData.reduce((sum, d) => sum + d.water, 0) / 7

        // Today's data
        const todayData = weeklyData[weeklyData.length - 1] || { calories: 0, protein: 0, carbs: 0, fat: 0 }

        // Calculate trends
        const macroTrends: MacroTrend[] = [
            {
                macro: 'calories',
                current: todayData.calories,
                target: targetCalories,
                weeklyAverage: avgCalories,
                trend: avgCalories > targetCalories ? 'rising' : avgCalories < targetCalories * 0.9 ? 'falling' : 'stable',
                percentChange: ((todayData.calories - avgCalories) / avgCalories) * 100 || 0,
                consistency: calculateConsistency(weeklyData.map(d => d.calories), targetCalories)
            },
            {
                macro: 'protein',
                current: todayData.protein,
                target: targetProtein,
                weeklyAverage: avgProtein,
                trend: avgProtein >= targetProtein ? 'rising' : 'falling',
                percentChange: ((todayData.protein - avgProtein) / avgProtein) * 100 || 0,
                consistency: calculateConsistency(weeklyData.map(d => d.protein), targetProtein)
            },
            {
                macro: 'carbs',
                current: todayData.carbs,
                target: targetCarbs,
                weeklyAverage: avgCarbs,
                trend: 'stable',
                percentChange: ((todayData.carbs - avgCarbs) / avgCarbs) * 100 || 0,
                consistency: calculateConsistency(weeklyData.map(d => d.carbs), targetCarbs)
            },
            {
                macro: 'fat',
                current: todayData.fat,
                target: targetFat,
                weeklyAverage: avgFat,
                trend: 'stable',
                percentChange: ((todayData.fat - avgFat) / avgFat) * 100 || 0,
                consistency: calculateConsistency(weeklyData.map(d => d.fat), targetFat)
            }
        ]

        // Calculate score
        const score: NutritionScore = calculateNutritionScore(weeklyData, goals, avgWater, targetWater)

        // Generate insights
        const insights = generateInsights(weeklyData, macroTrends, goals)

        // Generate recommendations
        const recommendations = generateRecommendations(todayData, goals)

        // Calculate streaks
        const streaks = calculateStreaks(weeklyData, goals)

        // Macro distribution
        const totalProteinCal = todayData.protein * 4
        const totalCarbsCal = todayData.carbs * 4
        const totalFatCal = todayData.fat * 9
        const totalMacroCal = totalProteinCal + totalCarbsCal + totalFatCal || 1

        const macroDistribution: MacroDistribution = {
            protein: {
                grams: todayData.protein,
                percentage: (totalProteinCal / totalMacroCal) * 100,
                calories: totalProteinCal
            },
            carbs: {
                grams: todayData.carbs,
                percentage: (totalCarbsCal / totalMacroCal) * 100,
                calories: totalCarbsCal
            },
            fat: {
                grams: todayData.fat,
                percentage: (totalFatCal / totalMacroCal) * 100,
                calories: totalFatCal
            }
        }

        // Weekly summary
        const weeklySummary: WeeklySummary = {
            weekStart: startDate,
            weekEnd: endDate,
            totalCalories: weeklyData.reduce((sum, d) => sum + d.calories, 0),
            avgCalories,
            totalProtein: weeklyData.reduce((sum, d) => sum + d.protein, 0),
            avgProtein,
            daysLogged: weeklyData.filter(d => d.calories > 0).length,
            goalsMetCount: weeklyData.filter(d => d.goalAchieved).length,
            bestDay: findBestDay(weeklyData),
            insights,
            score
        }

        return {
            weeklyData,
            macroTrends,
            score,
            insights,
            recommendations,
            streaks,
            weeklySummary,
            macroDistribution,
            eatingPatterns: [],
            comparison: []
        }
    }

    const calculateConsistency = (values: number[], target: number): number => {
        if (values.length === 0) return 0
        const inRange = values.filter(v => v >= target * 0.9 && v <= target * 1.1).length
        return Math.round((inRange / values.length) * 100)
    }

    const calculateNutritionScore = (
        weeklyData: WeeklyDataPoint[],
        goals: any,
        avgWater: number,
        targetWater: number
    ): NutritionScore => {
        const targetCalories = goals?.calories_target || 2000
        const targetProtein = goals?.protein_target || 150

        // Calculate individual scores
        const calorieAccuracy = Math.min(100, weeklyData.filter(d =>
            d.calories >= targetCalories * 0.9 && d.calories <= targetCalories * 1.1
        ).length / 7 * 100)

        const proteinGoal = Math.min(100, weeklyData.filter(d => d.protein >= targetProtein).length / 7 * 100)

        const avgProteinPerc = weeklyData.reduce((sum, d) => {
            const total = d.protein * 4 + d.carbs * 4 + d.fat * 9
            return sum + (total > 0 ? (d.protein * 4 / total) * 100 : 0)
        }, 0) / 7
        const macroBalance = avgProteinPerc >= 25 && avgProteinPerc <= 35 ? 100 : Math.max(0, 100 - Math.abs(30 - avgProteinPerc) * 3)

        const daysLogged = weeklyData.filter(d => d.calories > 0).length
        const consistency = (daysLogged / 7) * 100

        const hydration = Math.min(100, (avgWater / targetWater) * 100)

        const overall = Math.round(
            calorieAccuracy * 0.25 +
            proteinGoal * 0.25 +
            macroBalance * 0.2 +
            consistency * 0.2 +
            hydration * 0.1
        )

        const grade = overall >= 95 ? 'A+' :
            overall >= 85 ? 'A' :
                overall >= 80 ? 'B+' :
                    overall >= 70 ? 'B' :
                        overall >= 65 ? 'C+' :
                            overall >= 55 ? 'C' :
                                overall >= 45 ? 'D' : 'F'

        return {
            overall,
            breakdown: {
                calorieAccuracy: Math.round(calorieAccuracy),
                proteinGoal: Math.round(proteinGoal),
                macroBalance: Math.round(macroBalance),
                consistency: Math.round(consistency),
                hydration: Math.round(hydration)
            },
            grade,
            gradeColor: GRADE_COLORS[grade]
        }
    }

    const generateInsights = (weeklyData: WeeklyDataPoint[], trends: MacroTrend[], goals: any): MealInsight[] => {
        const insights: MealInsight[] = []
        const targetProtein = goals?.protein_target || 150

        // Check protein consistency
        const lowProteinDays = weeklyData.filter(d => d.protein < targetProtein * 0.8).length
        if (lowProteinDays >= 3) {
            insights.push({
                id: '1',
                type: 'warning',
                title: 'צריכת חלבון נמוכה',
                description: `ב-${lowProteinDays} ימים מתוך 7 צריכת החלבון שלך הייתה מתחת ליעד. נסה להוסיף מקורות חלבון כמו ביצים, עוף או קטניות.`,
                icon: '🥩',
                priority: 'high',
                actionable: true,
                action: 'צפה במלצות חלבון'
            })
        }

        // Check for good streaks
        const consecutiveGoalDays = weeklyData.filter(d => d.goalAchieved).length
        if (consecutiveGoalDays >= 5) {
            insights.push({
                id: '2',
                type: 'achievement',
                title: 'שבוע מצוין!',
                description: `השגת את יעד הקלוריות שלך ב-${consecutiveGoalDays} ימים השבוע. המשך כך!`,
                icon: '🏆',
                priority: 'medium',
                actionable: false
            })
        }

        // Tip for consistency
        const daysLogged = weeklyData.filter(d => d.calories > 0).length
        if (daysLogged < 5) {
            insights.push({
                id: '3',
                type: 'tip',
                title: 'תעד באופן עקבי',
                description: 'תיעוד יומי עוזר לך להבין טוב יותר את הרגלי האכילה שלך ולהשיג את היעדים.',
                icon: '📝',
                priority: 'low',
                actionable: true,
                action: 'הפעל תזכורות'
            })
        }

        // Suggestion for balance
        const avgFatPerc = weeklyData.reduce((sum, d) => {
            const total = d.protein * 4 + d.carbs * 4 + d.fat * 9
            return sum + (total > 0 ? (d.fat * 9 / total) * 100 : 0)
        }, 0) / 7

        if (avgFatPerc > 35) {
            insights.push({
                id: '4',
                type: 'suggestion',
                title: 'איזון שומנים',
                description: 'אחוז השומן בתזונה שלך גבוה מהמומלץ. נסה להחליף מקורות שומן רווי בשומנים בריאים.',
                icon: '🥑',
                priority: 'medium',
                actionable: true,
                action: 'צפה בטיפים'
            })
        }

        return insights
    }

    const generateRecommendations = (todayData: any, goals: any): FoodRecommendation[] => {
        const recommendations: FoodRecommendation[] = []
        const targetProtein = goals?.protein_target || 150

        if (todayData.protein < targetProtein * 0.7) {
            recommendations.push(
                {
                    id: '1',
                    name: 'Greek Yogurt',
                    nameHe: 'יוגורט יווני',
                    reason: 'עשיר בחלבון ומתאים לחטיף או ארוחת בוקר',
                    macroBoost: 'protein',
                    calories: 100,
                    protein: 17,
                    carbs: 6,
                    fat: 1,
                    imageEmoji: '🥛',
                    tags: ['חלבי', 'חטיף', 'מהיר']
                },
                {
                    id: '2',
                    name: 'Chicken Breast',
                    nameHe: 'חזה עוף',
                    reason: 'מקור חלבון מצוין עם מעט שומן',
                    macroBoost: 'protein',
                    calories: 165,
                    protein: 31,
                    carbs: 0,
                    fat: 4,
                    imageEmoji: '🍗',
                    tags: ['ארוחה עיקרית', 'דל שומן']
                },
                {
                    id: '3',
                    name: 'Eggs',
                    nameHe: 'ביצים',
                    reason: 'מקור חלבון איכותי עם ויטמינים חיוניים',
                    macroBoost: 'protein',
                    calories: 155,
                    protein: 13,
                    carbs: 1,
                    fat: 11,
                    imageEmoji: '🥚',
                    tags: ['ארוחת בוקר', 'מהיר', 'רב-תכליתי']
                }
            )
        }

        if (todayData.carbs < 100) {
            recommendations.push({
                id: '4',
                name: 'Oatmeal',
                nameHe: 'שיבולת שועל',
                reason: 'פחמימות מורכבות שמספקות אנרגיה לאורך זמן',
                macroBoost: 'carbs',
                calories: 150,
                protein: 5,
                carbs: 27,
                fat: 3,
                imageEmoji: '🥣',
                tags: ['ארוחת בוקר', 'סיבים', 'אנרגיה']
            })
        }

        // Always add a balanced option
        recommendations.push({
            id: '5',
            name: 'Salmon',
            nameHe: 'סלמון',
            reason: 'מאוזן ועשיר באומגה 3 לבריאות הלב',
            macroBoost: 'balanced',
            calories: 208,
            protein: 20,
            carbs: 0,
            fat: 13,
            imageEmoji: '🐟',
            tags: ['אומגה 3', 'ארוחה עיקרית', 'בריא']
        })

        return recommendations.slice(0, 4)
    }

    const calculateStreaks = (weeklyData: WeeklyDataPoint[], goals: any): StreakData[] => {
        const targetCalories = goals?.calories_target || 2000
        const targetProtein = goals?.protein_target || 150
        const targetWater = goals?.water_target_ml || 2500

        // Simple streak calculation (would be more complex with historical data)
        let calorieStreak = 0
        let proteinStreak = 0
        let waterStreak = 0
        let loggingStreak = 0

        for (let i = weeklyData.length - 1; i >= 0; i--) {
            const d = weeklyData[i]
            if (d.goalAchieved && calorieStreak === weeklyData.length - 1 - i) calorieStreak++
            if (d.protein >= targetProtein && proteinStreak === weeklyData.length - 1 - i) proteinStreak++
            if (d.water >= targetWater && waterStreak === weeklyData.length - 1 - i) waterStreak++
            if (d.calories > 0 && loggingStreak === weeklyData.length - 1 - i) loggingStreak++
        }

        return [
            { streakType: 'calories', currentStreak: calorieStreak, longestStreak: Math.max(calorieStreak, 5), lastActiveDate: weeklyData[weeklyData.length - 1]?.date || '' },
            { streakType: 'protein', currentStreak: proteinStreak, longestStreak: Math.max(proteinStreak, 4), lastActiveDate: weeklyData[weeklyData.length - 1]?.date || '' },
            { streakType: 'water', currentStreak: waterStreak, longestStreak: Math.max(waterStreak, 3), lastActiveDate: weeklyData[weeklyData.length - 1]?.date || '' },
            { streakType: 'logging', currentStreak: loggingStreak, longestStreak: Math.max(loggingStreak, 7), lastActiveDate: weeklyData[weeklyData.length - 1]?.date || '' }
        ]
    }

    const findBestDay = (weeklyData: WeeklyDataPoint[]): string => {
        const best = weeklyData.reduce((best, current) => {
            if (!best) return current
            const currentScore = current.goalAchieved ? 1 : 0
            const bestScore = best.goalAchieved ? 1 : 0
            return currentScore > bestScore ? current : best
        }, weeklyData[0])

        if (!best) return ''
        const dayHe = DAY_NAMES_HE[best.dayName as keyof typeof DAY_NAMES_HE] || best.dayName
        return `יום ${dayHe}`
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                        <Loader2 className="w-8 h-8 text-primary" />
                    </motion.div>
                    <p className="text-muted-foreground">טוען תובנות...</p>
                </motion.div>
            </div>
        )
    }

    if (!insightsData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h2 className="text-xl font-semibold mb-2">אין נתונים עדיין</h2>
                    <p className="text-muted-foreground mb-4">התחל לתעד את הארוחות שלך כדי לראות תובנות</p>
                    <Link
                        href="/nutrition"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <span>עבור לתיעוד</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-24 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/nutrition"
                                className="p-2 rounded-xl hover:bg-accent transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">תובנות תזונה</h1>
                                <p className="text-xs text-muted-foreground">ניתוח חכם של התזונה שלך</p>
                            </div>
                        </div>

                        <motion.button
                            className="p-2 rounded-xl hover:bg-accent transition-colors"
                            onClick={loadInsightsData}
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                        >
                            <RefreshCw className="w-5 h-5 text-muted-foreground" />
                        </motion.button>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {[
                            { key: 'overview', label: 'סקירה כללית', icon: Sparkles },
                            { key: 'trends', label: 'מגמות', icon: TrendingUp },
                            { key: 'recommendations', label: 'המלצות', icon: BarChart3 }
                        ].map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.key
                                            ? "bg-primary text-primary-foreground shadow-lg"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Score and Summary row */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Score Ring */}
                                <div className="rounded-2xl border bg-card p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-center">ציון תזונה שבועי</h3>
                                    <NutritionScoreRing score={insightsData.score} />
                                </div>

                                {/* Weekly Summary */}
                                <WeeklySummaryCard summary={insightsData.weeklySummary} />
                            </div>

                            {/* Macro Trends */}
                            <MacroTrendCards trends={insightsData.macroTrends} />

                            {/* Insights */}
                            <InsightsCards insights={insightsData.insights} />

                            {/* Streaks */}
                            <StreakBadges streaks={insightsData.streaks} />
                        </motion.div>
                    )}

                    {activeTab === 'trends' && (
                        <motion.div
                            key="trends"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Weekly Chart */}
                            <WeeklyChart
                                data={insightsData.weeklyData}
                                targetCalories={insightsData.macroTrends[0]?.target || 2000}
                            />

                            {/* Macro Distribution */}
                            <div className="rounded-2xl border bg-card p-6">
                                <h3 className="text-lg font-semibold mb-6 text-center">התפלגות מאקרו (היום)</h3>
                                <MacroDonut distribution={insightsData.macroDistribution} />
                            </div>

                            {/* Macro Trends Cards */}
                            <MacroTrendCards trends={insightsData.macroTrends} />
                        </motion.div>
                    )}

                    {activeTab === 'recommendations' && (
                        <motion.div
                            key="recommendations"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Food Recommendations */}
                            <FoodRecommendations
                                recommendations={insightsData.recommendations}
                                onAddFood={(food) => console.log('Add food:', food)}
                            />

                            {/* Insights */}
                            <InsightsCards insights={insightsData.insights} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
