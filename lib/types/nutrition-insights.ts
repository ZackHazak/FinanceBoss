// Modern Nutrition Insights Types - 2026 Style

import { DailyNutrition, NutritionGoals } from './nutrition'

// Trend analysis for macros
export interface MacroTrend {
    macro: 'calories' | 'protein' | 'carbs' | 'fat'
    current: number
    target: number
    weeklyAverage: number
    trend: 'rising' | 'falling' | 'stable'
    percentChange: number
    consistency: number // 0-100 score
}

// Weekly nutrition data point
export interface WeeklyDataPoint {
    date: string
    dayName: string
    calories: number
    protein: number
    carbs: number
    fat: number
    water: number
    goalAchieved: boolean
}

// AI-generated meal insight
export interface MealInsight {
    id: string
    type: 'tip' | 'warning' | 'achievement' | 'suggestion'
    title: string
    description: string
    icon: string
    priority: 'low' | 'medium' | 'high'
    actionable: boolean
    action?: string
}

// Smart food recommendation
export interface FoodRecommendation {
    id: string
    name: string
    nameHe: string
    reason: string
    macroBoost: 'protein' | 'carbs' | 'fat' | 'balanced'
    calories: number
    protein: number
    carbs: number
    fat: number
    imageEmoji: string
    tags: string[]
}

// Nutrition score breakdown
export interface NutritionScore {
    overall: number // 0-100
    breakdown: {
        calorieAccuracy: number
        proteinGoal: number
        macroBalance: number
        consistency: number
        hydration: number
    }
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
    gradeColor: string
}

// Streak data
export interface StreakData {
    currentStreak: number
    longestStreak: number
    lastActiveDate: string
    streakType: 'calories' | 'protein' | 'water' | 'logging'
}

// Weekly summary
export interface WeeklySummary {
    weekStart: string
    weekEnd: string
    totalCalories: number
    avgCalories: number
    totalProtein: number
    avgProtein: number
    daysLogged: number
    goalsMetCount: number
    bestDay: string
    insights: MealInsight[]
    score: NutritionScore
}

// Macro distribution for pie/donut charts
export interface MacroDistribution {
    protein: { grams: number; percentage: number; calories: number }
    carbs: { grams: number; percentage: number; calories: number }
    fat: { grams: number; percentage: number; calories: number }
}

// Time-based eating patterns
export interface EatingPattern {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    avgTime: string
    avgCalories: number
    frequency: number // days per week
    consistency: number // 0-100
}

// Comparison data (week over week, etc.)
export interface ComparisonData {
    period: 'week' | 'month'
    currentAvg: number
    previousAvg: number
    change: number
    changePercent: number
    trend: 'better' | 'worse' | 'same'
}

// Full insights dashboard data
export interface NutritionInsightsData {
    weeklyData: WeeklyDataPoint[]
    macroTrends: MacroTrend[]
    score: NutritionScore
    insights: MealInsight[]
    recommendations: FoodRecommendation[]
    streaks: StreakData[]
    weeklySummary: WeeklySummary
    macroDistribution: MacroDistribution
    eatingPatterns: EatingPattern[]
    comparison: ComparisonData[]
}

// Colors for each macro (consistent with design system)
export const MACRO_COLORS = {
    calories: {
        primary: '#f97316',
        secondary: '#fed7aa',
        gradient: 'from-orange-500 to-amber-400'
    },
    protein: {
        primary: '#ef4444',
        secondary: '#fecaca',
        gradient: 'from-red-500 to-rose-400'
    },
    carbs: {
        primary: '#f59e0b',
        secondary: '#fde68a',
        gradient: 'from-amber-500 to-yellow-400'
    },
    fat: {
        primary: '#eab308',
        secondary: '#fef08a',
        gradient: 'from-yellow-500 to-lime-400'
    },
    water: {
        primary: '#3b82f6',
        secondary: '#bfdbfe',
        gradient: 'from-blue-500 to-cyan-400'
    }
} as const

// Grade colors
export const GRADE_COLORS = {
    'A+': '#22c55e',
    'A': '#4ade80',
    'B+': '#84cc16',
    'B': '#a3e635',
    'C+': '#facc15',
    'C': '#fbbf24',
    'D': '#fb923c',
    'F': '#ef4444'
} as const

// Hebrew labels
export const INSIGHT_TYPE_LABELS = {
    tip: 'טיפ',
    warning: 'אזהרה',
    achievement: 'הישג',
    suggestion: 'המלצה'
} as const

export const TREND_LABELS = {
    rising: 'עולה',
    falling: 'יורד',
    stable: 'יציב'
} as const

export const DAY_NAMES_HE = {
    Sunday: 'ראשון',
    Monday: 'שני',
    Tuesday: 'שלישי',
    Wednesday: 'רביעי',
    Thursday: 'חמישי',
    Friday: 'שישי',
    Saturday: 'שבת'
} as const
