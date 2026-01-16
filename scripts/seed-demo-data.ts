/**
 * Demo Data Seed Script
 * This script replaces real data with demo data for preview deployments
 * Run with: npx tsx scripts/seed-demo-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Demo transactions data
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

// Demo budgets data
const demoBudgets = [
    { category: 'food', amount: 2000 },
    { category: 'transport', amount: 800 },
    { category: 'entertainment', amount: 500 },
    { category: 'shopping', amount: 1000 },
    { category: 'bills', amount: 600 },
    { category: 'health', amount: 300 },
]

// Demo nutrition data
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

// Demo fitness targets (PPL split)
const demoFitnessTargets = [
    // Push Day
    { day_name: 'Push', order_index: 0, exercise_name: 'Bench Press', target_sets: '4', target_reps: '8-10', target_rpe: '8', target_rest: '2:30' },
    { day_name: 'Push', order_index: 1, exercise_name: 'Overhead Press', target_sets: '3', target_reps: '8-10', target_rpe: '8', target_rest: '2:00' },
    { day_name: 'Push', order_index: 2, exercise_name: 'Incline Dumbbell Press', target_sets: '3', target_reps: '10-12', target_rpe: '7', target_rest: '1:30' },
    // Pull Day
    { day_name: 'Pull', order_index: 0, exercise_name: 'Deadlift', target_sets: '4', target_reps: '5-6', target_rpe: '8', target_rest: '3:00' },
    { day_name: 'Pull', order_index: 1, exercise_name: 'Barbell Row', target_sets: '4', target_reps: '8-10', target_rpe: '8', target_rest: '2:00' },
    { day_name: 'Pull', order_index: 2, exercise_name: 'Pull-ups', target_sets: '3', target_reps: '8-12', target_rpe: '8', target_rest: '2:00' },
    // Legs Day
    { day_name: 'Legs', order_index: 0, exercise_name: 'Squat', target_sets: '4', target_reps: '6-8', target_rpe: '8', target_rest: '3:00' },
    { day_name: 'Legs', order_index: 1, exercise_name: 'Romanian Deadlift', target_sets: '3', target_reps: '10-12', target_rpe: '7', target_rest: '2:00' },
    { day_name: 'Legs', order_index: 2, exercise_name: 'Leg Press', target_sets: '3', target_reps: '12-15', target_rpe: '7', target_rest: '1:30' },
]

async function clearData() {
    console.log('🗑️  Clearing existing data...')

    // Clear in correct order due to foreign keys
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

    console.log('✅ Data cleared')
}

async function seedTransactions() {
    console.log('💰 Seeding transactions...')

    const transactions = demoTransactions.map((t, i) => ({
        ...t,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    }))

    const { error } = await supabase.from('transactions').insert(transactions)
    if (error) console.error('Error seeding transactions:', error)
    else console.log(`✅ Inserted ${transactions.length} transactions`)
}

async function seedBudgets() {
    console.log('📊 Seeding budgets...')

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    const budgets = demoBudgets.map(b => ({
        ...b,
        month: currentMonth
    }))

    const { error } = await supabase.from('budgets').insert(budgets)
    if (error) console.error('Error seeding budgets:', error)
    else console.log(`✅ Inserted ${budgets.length} budgets`)
}

async function seedNutrition() {
    console.log('🥗 Seeding nutrition data...')

    // Foods
    const { error: foodsError } = await supabase.from('foods').insert(demoFoods)
    if (foodsError) console.error('Error seeding foods:', foodsError)
    else console.log(`✅ Inserted ${demoFoods.length} foods`)

    // Nutrition goals
    const { error: goalsError } = await supabase.from('nutrition_goals').insert(demoNutritionGoals)
    if (goalsError) console.error('Error seeding nutrition goals:', goalsError)
    else console.log('✅ Inserted nutrition goals')
}

async function seedFitness() {
    console.log('💪 Seeding fitness data...')

    const { error } = await supabase.from('fitness_targets').insert(demoFitnessTargets)
    if (error) console.error('Error seeding fitness targets:', error)
    else console.log(`✅ Inserted ${demoFitnessTargets.length} fitness targets`)
}

async function main() {
    console.log('🚀 Starting demo data seed...')
    console.log(`📍 Supabase URL: ${supabaseUrl}`)

    try {
        await clearData()
        await seedTransactions()
        await seedBudgets()
        await seedNutrition()
        await seedFitness()

        console.log('\n✨ Demo data seeded successfully!')
    } catch (error) {
        console.error('❌ Error seeding data:', error)
        process.exit(1)
    }
}

main()
