import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Only allow in preview environment
const isPreview = process.env.VERCEL_ENV === 'preview'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Demo data
const demoTransactions = [
    { amount: 15000, description: 'משכורת', type: 'income', category: 'salary' },
    { amount: 12500, description: 'פרילנס', type: 'income', category: 'freelance' },
    { amount: 850, description: 'סופר', type: 'expense', category: 'food' },
    { amount: 420, description: 'מסעדה', type: 'expense', category: 'food' },
    { amount: 3500, description: 'שכירות', type: 'expense', category: 'housing' },
    { amount: 280, description: 'חשמל', type: 'expense', category: 'bills' },
    { amount: 150, description: 'אינטרנט', type: 'expense', category: 'bills' },
    { amount: 200, description: 'נטפליקס + ספוטיפיי', type: 'expense', category: 'entertainment' },
    { amount: 350, description: 'דלק', type: 'expense', category: 'transport' },
    { amount: 180, description: 'חניה', type: 'expense', category: 'transport' },
    { amount: 500, description: 'ביגוד', type: 'expense', category: 'shopping' },
    { amount: 120, description: 'תרופות', type: 'expense', category: 'health' },
]

const demoBudgets = [
    { category: 'food', amount: 2000 },
    { category: 'transport', amount: 800 },
    { category: 'entertainment', amount: 500 },
    { category: 'shopping', amount: 1000 },
    { category: 'bills', amount: 600 },
    { category: 'health', amount: 300 },
]

const demoFoods = [
    { name: 'Chicken Breast', name_he: 'חזה עוף', serving_size: 100, serving_unit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Brown Rice', name_he: 'אורז מלא', serving_size: 100, serving_unit: 'g', calories: 112, protein: 2.6, carbs: 24, fat: 0.9 },
    { name: 'Eggs', name_he: 'ביצים', serving_size: 50, serving_unit: 'g', calories: 78, protein: 6, carbs: 0.6, fat: 5 },
    { name: 'Greek Yogurt', name_he: 'יוגורט יווני', serving_size: 170, serving_unit: 'g', calories: 100, protein: 17, carbs: 6, fat: 0.7 },
    { name: 'Banana', name_he: 'בננה', serving_size: 118, serving_unit: 'g', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
    { name: 'Oatmeal', name_he: 'שיבולת שועל', serving_size: 40, serving_unit: 'g', calories: 150, protein: 5, carbs: 27, fat: 3 },
]

const demoNutritionGoals = {
    calories_target: 2200,
    protein_target: 160,
    carbs_target: 220,
    fat_target: 70,
    water_target_ml: 3000,
    is_active: true,
}

const demoFitnessTargets = [
    { day_name: 'Push', order_index: 0, exercise_name: 'Bench Press', target_sets: '4', target_reps: '8-10', target_rpe: '8', target_rest: '2:30' },
    { day_name: 'Push', order_index: 1, exercise_name: 'Overhead Press', target_sets: '3', target_reps: '8-10', target_rpe: '8', target_rest: '2:00' },
    { day_name: 'Push', order_index: 2, exercise_name: 'Incline Dumbbell Press', target_sets: '3', target_reps: '10-12', target_rpe: '7', target_rest: '1:30' },
    { day_name: 'Pull', order_index: 0, exercise_name: 'Deadlift', target_sets: '4', target_reps: '5-6', target_rpe: '8', target_rest: '3:00' },
    { day_name: 'Pull', order_index: 1, exercise_name: 'Barbell Row', target_sets: '4', target_reps: '8-10', target_rpe: '8', target_rest: '2:00' },
    { day_name: 'Pull', order_index: 2, exercise_name: 'Pull-ups', target_sets: '3', target_reps: '8-12', target_rpe: '8', target_rest: '2:00' },
    { day_name: 'Legs', order_index: 0, exercise_name: 'Squat', target_sets: '4', target_reps: '6-8', target_rpe: '8', target_rest: '3:00' },
    { day_name: 'Legs', order_index: 1, exercise_name: 'Romanian Deadlift', target_sets: '3', target_reps: '10-12', target_rpe: '7', target_rest: '2:00' },
    { day_name: 'Legs', order_index: 2, exercise_name: 'Leg Press', target_sets: '3', target_reps: '12-15', target_rpe: '7', target_rest: '1:30' },
]

export async function POST(request: Request) {
    // Security: Only allow in preview or with secret key
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (!isPreview && secret !== process.env.SEED_SECRET) {
        return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // Clear existing data
        await supabase.from('meal_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('meals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('fitness_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('fitness_daily_summary').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('fitness_targets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('foods').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('nutrition_goals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('water_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('weight_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // Insert demo transactions
        const transactions = demoTransactions.map((t, i) => ({
            ...t,
            created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        }))
        await supabase.from('transactions').insert(transactions)

        // Insert demo budgets
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
        const budgets = demoBudgets.map(b => ({ ...b, month: currentMonth }))
        await supabase.from('budgets').insert(budgets)

        // Insert demo foods
        await supabase.from('foods').insert(demoFoods)

        // Insert nutrition goals
        await supabase.from('nutrition_goals').insert(demoNutritionGoals)

        // Insert fitness targets
        await supabase.from('fitness_targets').insert(demoFitnessTargets)

        return NextResponse.json({
            success: true,
            message: 'Demo data seeded successfully',
            counts: {
                transactions: transactions.length,
                budgets: budgets.length,
                foods: demoFoods.length,
                fitnessTargets: demoFitnessTargets.length
            }
        })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST to seed demo data',
        isPreview,
        env: process.env.VERCEL_ENV || 'local'
    })
}
