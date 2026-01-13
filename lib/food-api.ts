/**
 * Food API Integration
 *
 * This module provides integration with food databases for nutritional information.
 *
 * ## Available APIs (Free Options):
 *
 * ### 1. USDA FoodData Central (Recommended)
 * - URL: https://fdc.nal.usda.gov/api-guide.html
 * - Free API key required (sign up at https://fdc.nal.usda.gov/api-key-signup.html)
 * - Contains 300,000+ foods with detailed nutrition data
 * - Rate limit: 1,000 requests/hour
 *
 * ### 2. Open Food Facts
 * - URL: https://world.openfoodfacts.org/data
 * - No API key required
 * - Contains millions of packaged food products worldwide
 * - Includes barcode scanning data
 * - Rate limit: None (but be reasonable)
 *
 * ### 3. Nutritionix (Freemium)
 * - URL: https://www.nutritionix.com/business/api
 * - Free tier: 500 calls/month
 * - Best for branded/restaurant foods
 *
 * ## Setup Instructions:
 *
 * 1. Get a USDA API key from: https://fdc.nal.usda.gov/api-key-signup.html
 * 2. Add to .env.local:
 *    NEXT_PUBLIC_USDA_API_KEY=your_api_key_here
 * 3. Use the functions below to search and fetch foods
 */

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || ''
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'

export interface USDAFood {
    fdcId: number
    description: string
    brandOwner?: string
    foodNutrients: {
        nutrientId: number
        nutrientName: string
        value: number
        unitName: string
    }[]
    servingSize?: number
    servingSizeUnit?: string
}

export interface NormalizedFood {
    name: string
    brand?: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
    serving_size: number
    serving_unit: string
    api_id: string
    api_source: 'usda' | 'openfoodfacts'
}

// USDA Nutrient IDs
const NUTRIENT_IDS = {
    CALORIES: 1008,
    PROTEIN: 1003,
    FAT: 1004,
    CARBS: 1005,
    FIBER: 1079,
    SUGAR: 2000,
    SODIUM: 1093
}

/**
 * Search USDA FoodData Central
 */
export async function searchUSDA(query: string, pageSize = 20): Promise<NormalizedFood[]> {
    if (!USDA_API_KEY) {
        console.warn('USDA API key not configured. Add NEXT_PUBLIC_USDA_API_KEY to .env.local')
        return []
    }

    try {
        const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                pageSize,
                dataType: ['Foundation', 'SR Legacy', 'Branded']
            })
        })

        if (!response.ok) throw new Error('USDA API error')

        const data = await response.json()
        return (data.foods || []).map(normalizeUSDAFood)
    } catch (error) {
        console.error('USDA search error:', error)
        return []
    }
}

function normalizeUSDAFood(food: USDAFood): NormalizedFood {
    const getNutrient = (id: number) => {
        const nutrient = food.foodNutrients.find(n => n.nutrientId === id)
        return nutrient?.value || 0
    }

    return {
        name: food.description,
        brand: food.brandOwner,
        calories: getNutrient(NUTRIENT_IDS.CALORIES),
        protein: getNutrient(NUTRIENT_IDS.PROTEIN),
        carbs: getNutrient(NUTRIENT_IDS.CARBS),
        fat: getNutrient(NUTRIENT_IDS.FAT),
        fiber: getNutrient(NUTRIENT_IDS.FIBER),
        sugar: getNutrient(NUTRIENT_IDS.SUGAR),
        sodium: getNutrient(NUTRIENT_IDS.SODIUM),
        serving_size: food.servingSize || 100,
        serving_unit: food.servingSizeUnit || 'g',
        api_id: food.fdcId.toString(),
        api_source: 'usda'
    }
}

/**
 * Search Open Food Facts (no API key needed)
 */
export async function searchOpenFoodFacts(query: string, pageSize = 20): Promise<NormalizedFood[]> {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=${pageSize}`
        )

        if (!response.ok) throw new Error('Open Food Facts API error')

        const data = await response.json()
        return (data.products || []).map(normalizeOFFFood).filter(Boolean) as NormalizedFood[]
    } catch (error) {
        console.error('Open Food Facts search error:', error)
        return []
    }
}

function normalizeOFFFood(product: any): NormalizedFood | null {
    if (!product.product_name) return null

    const nutrients = product.nutriments || {}

    return {
        name: product.product_name,
        brand: product.brands,
        calories: nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0,
        protein: nutrients.proteins_100g || 0,
        carbs: nutrients.carbohydrates_100g || 0,
        fat: nutrients.fat_100g || 0,
        fiber: nutrients.fiber_100g || 0,
        sugar: nutrients.sugars_100g || 0,
        sodium: nutrients.sodium_100g ? nutrients.sodium_100g * 1000 : 0, // Convert to mg
        serving_size: 100,
        serving_unit: 'g',
        api_id: product.code || product._id,
        api_source: 'openfoodfacts'
    }
}

/**
 * Search by barcode using Open Food Facts
 */
export async function searchByBarcode(barcode: string): Promise<NormalizedFood | null> {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        )

        if (!response.ok) throw new Error('Barcode lookup error')

        const data = await response.json()
        if (data.status !== 1) return null

        return normalizeOFFFood(data.product)
    } catch (error) {
        console.error('Barcode lookup error:', error)
        return null
    }
}

/**
 * Combined search - searches both APIs and merges results
 */
export async function searchFoods(query: string): Promise<NormalizedFood[]> {
    const [usdaResults, offResults] = await Promise.all([
        searchUSDA(query, 10),
        searchOpenFoodFacts(query, 10)
    ])

    // Merge and deduplicate by name (prefer USDA data)
    const seen = new Set<string>()
    const results: NormalizedFood[] = []

    for (const food of [...usdaResults, ...offResults]) {
        const key = food.name.toLowerCase()
        if (!seen.has(key)) {
            seen.add(key)
            results.push(food)
        }
    }

    return results.slice(0, 20)
}
