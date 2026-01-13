// Nutrition Module Types

export interface Food {
    id: string
    name: string
    name_he?: string
    brand?: string
    serving_size: number
    serving_unit: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
    api_id?: string
    api_source?: 'usda' | 'openfoodfacts' | 'manual'
    is_favorite: boolean
    created_at: string
}

export interface Meal {
    id: string
    date: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    created_at: string
    items?: MealItem[]
}

export interface MealItem {
    id: string
    meal_id: string
    food_id?: string
    food?: Food
    custom_name?: string
    quantity: number
    serving_size: number
    serving_unit: string
    calories: number
    protein: number
    carbs: number
    fat: number
    created_at: string
}

export interface WaterLog {
    id: string
    date: string
    amount_ml: number
    created_at: string
}

export interface WeightLog {
    id: string
    date: string
    weight_kg: number
    notes?: string
    created_at: string
}

export interface NutritionGoals {
    id: string
    calories_target: number
    protein_target: number
    carbs_target: number
    fat_target: number
    water_target_ml: number
    is_active: boolean
    created_at: string
}

export interface DailyNutrition {
    date: string
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
    totalWater: number
    meals: {
        breakfast: MealItem[]
        lunch: MealItem[]
        dinner: MealItem[]
        snack: MealItem[]
    }
}

export const MEAL_TYPE_LABELS: Record<Meal['meal_type'], string> = {
    breakfast: 'ארוחת בוקר',
    lunch: 'ארוחת צהריים',
    dinner: 'ארוחת ערב',
    snack: 'חטיף'
}

export const MEAL_TYPE_ICONS: Record<Meal['meal_type'], string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎'
}
