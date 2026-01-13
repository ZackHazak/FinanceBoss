"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Plus, Star, Loader2, Sparkles, Clock, Heart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { MEAL_TYPE_LABELS, type Meal, type Food } from "@/lib/types/nutrition"
import { cn } from "@/lib/utils"

interface AddFoodDialogProps {
    isOpen: boolean
    onClose: () => void
    mealType: Meal['meal_type']
    date: string
    onSuccess: () => void
}

export function AddFoodDialog({ isOpen, onClose, mealType, date, onSuccess }: AddFoodDialogProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Food[]>([])
    const [favorites, setFavorites] = useState<Food[]>([])
    const [recentFoods, setRecentFoods] = useState<Food[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'recent'>('search')
    const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)

    // Quick add form
    const [quickFood, setQuickFood] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        serving_size: '100',
        serving_unit: 'g'
    })

    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchFavorites()
            fetchRecentFoods()
            setTimeout(() => searchInputRef.current?.focus(), 100)
        } else {
            setSearchQuery('')
            setSearchResults([])
            setShowQuickAdd(false)
            resetQuickFood()
        }
    }, [isOpen])

    function resetQuickFood() {
        setQuickFood({
            name: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            serving_size: '100',
            serving_unit: 'g'
        })
    }

    async function fetchFavorites() {
        const { data } = await supabase
            .from('foods')
            .select('*')
            .eq('is_favorite', true)
            .order('name')
            .limit(20)

        setFavorites(data || [])
    }

    async function fetchRecentFoods() {
        const { data } = await supabase
            .from('foods')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        setRecentFoods(data || [])
    }

    async function searchFoods(query: string) {
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            const { data } = await supabase
                .from('foods')
                .select('*')
                .or(`name.ilike.%${query}%,name_he.ilike.%${query}%,brand.ilike.%${query}%`)
                .limit(20)

            setSearchResults(data || [])
        } finally {
            setIsSearching(false)
        }
    }

    function handleSearchChange(value: string) {
        setSearchQuery(value)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => {
            searchFoods(value)
        }, 300)
    }

    async function addFoodToMeal(food: Food, quantity: number = 1) {
        setIsAdding(true)
        try {
            // Get or create meal for this date and type
            let mealId: string

            const { data: existingMeal } = await supabase
                .from('meals')
                .select('id')
                .eq('date', date)
                .eq('meal_type', mealType)
                .single()

            if (existingMeal) {
                mealId = existingMeal.id
            } else {
                const { data: newMeal, error } = await supabase
                    .from('meals')
                    .insert({ date, meal_type: mealType })
                    .select('id')
                    .single()

                if (error) throw error
                mealId = newMeal.id
            }

            // Add meal item
            const { error } = await supabase
                .from('meal_items')
                .insert({
                    meal_id: mealId,
                    food_id: food.id,
                    quantity,
                    serving_size: food.serving_size,
                    serving_unit: food.serving_unit,
                    calories: food.calories * quantity,
                    protein: food.protein * quantity,
                    carbs: food.carbs * quantity,
                    fat: food.fat * quantity
                })

            if (error) throw error

            onSuccess()
            onClose()
        } catch (err) {
            console.error('Error adding food:', err)
        } finally {
            setIsAdding(false)
        }
    }

    async function handleQuickAdd() {
        if (!quickFood.name.trim()) return

        setIsAdding(true)
        try {
            // Create the food
            const { data: newFood, error: foodError } = await supabase
                .from('foods')
                .insert({
                    name: quickFood.name,
                    calories: Number(quickFood.calories) || 0,
                    protein: Number(quickFood.protein) || 0,
                    carbs: Number(quickFood.carbs) || 0,
                    fat: Number(quickFood.fat) || 0,
                    serving_size: Number(quickFood.serving_size) || 100,
                    serving_unit: quickFood.serving_unit,
                    api_source: 'manual'
                })
                .select()
                .single()

            if (foodError) throw foodError

            // Add to meal
            await addFoodToMeal(newFood)
        } catch (err) {
            console.error('Error in quick add:', err)
        } finally {
            setIsAdding(false)
        }
    }

    async function toggleFavorite(food: Food) {
        setTogglingFavorite(food.id)
        const { error } = await supabase
            .from('foods')
            .update({ is_favorite: !food.is_favorite })
            .eq('id', food.id)

        if (!error) {
            // Optimistic update
            const updateFood = (f: Food) => f.id === food.id ? { ...f, is_favorite: !f.is_favorite } : f
            setSearchResults(prev => prev.map(updateFood))
            setRecentFoods(prev => prev.map(updateFood))
            if (food.is_favorite) {
                setFavorites(prev => prev.filter(f => f.id !== food.id))
            } else {
                setFavorites(prev => [...prev, { ...food, is_favorite: true }])
            }
        }
        setTimeout(() => setTogglingFavorite(null), 300)
    }

    if (!isOpen) return null

    const displayFoods = activeTab === 'favorites' ? favorites :
        activeTab === 'recent' ? recentFoods :
            searchResults

    const tabs = [
        { id: 'search', label: 'חיפוש', icon: Search },
        { id: 'favorites', label: 'מועדפים', icon: Heart },
        { id: 'recent', label: 'אחרונים', icon: Clock }
    ]

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle bar for mobile */}
                    <div className="flex justify-center pt-3 pb-1 md:hidden">
                        <div className="w-10 h-1 rounded-full bg-slate-300" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900">
                            הוסף ל{MEAL_TYPE_LABELS[mealType]}
                        </h2>
                        <motion.button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <X className="h-5 w-5 text-slate-500" />
                        </motion.button>
                    </div>

                    {showQuickAdd ? (
                        /* Quick Add Form */
                        <motion.div
                            className="p-5 space-y-5 overflow-y-auto"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                                        <Sparkles className="h-4 w-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800">הוספה מהירה</h3>
                                </div>
                                <button
                                    onClick={() => setShowQuickAdd(false)}
                                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                    ← חזור לחיפוש
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="שם המזון *"
                                        value={quickFood.name}
                                        onChange={(e) => setQuickFood(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'calories', label: 'קלוריות', color: 'orange' },
                                        { key: 'protein', label: 'חלבון (g)', color: 'red' },
                                        { key: 'carbs', label: 'פחמימות (g)', color: 'amber' },
                                        { key: 'fat', label: 'שומן (g)', color: 'yellow' }
                                    ].map(field => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-500">{field.label}</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={quickFood[field.key as keyof typeof quickFood]}
                                                onChange={(e) => setQuickFood(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500">גודל מנה</label>
                                        <input
                                            type="number"
                                            placeholder="100"
                                            value={quickFood.serving_size}
                                            onChange={(e) => setQuickFood(prev => ({ ...prev, serving_size: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-500">יחידה</label>
                                        <select
                                            value={quickFood.serving_unit}
                                            onChange={(e) => setQuickFood(prev => ({ ...prev, serving_unit: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="g">גרם</option>
                                            <option value="ml">מ״ל</option>
                                            <option value="piece">יחידה</option>
                                            <option value="cup">כוס</option>
                                            <option value="tbsp">כף</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                onClick={handleQuickAdd}
                                disabled={!quickFood.name.trim() || isAdding}
                                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {isAdding ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="h-5 w-5" />
                                        הוסף לארוחה
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    ) : (
                        <>
                            {/* Search */}
                            <div className="p-4">
                                <div className="relative">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="חפש מזון..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="w-full pr-12 pl-12 py-3.5 bg-slate-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500 focus:outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-spin" />
                                    )}
                                </div>
                            </div>

                            {/* Modern Tabs */}
                            <div className="px-4 pb-3">
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                    {tabs.map(tab => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id
                                        return (
                                            <motion.button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                                                    isActive
                                                        ? "bg-white text-green-600 shadow-sm"
                                                        : "text-slate-500 hover:text-slate-700"
                                                )}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{tab.label}</span>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Results */}
                            <div className="flex-1 overflow-y-auto min-h-[280px] max-h-[380px] px-2">
                                {displayFoods.length > 0 ? (
                                    <div className="space-y-1 pb-2">
                                        {displayFoods.map((food, index) => (
                                            <motion.div
                                                key={food.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="flex items-center justify-between p-3 mx-2 hover:bg-slate-50 rounded-xl transition-colors group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-800 truncate">
                                                        {food.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                                                            {Math.round(food.calories)} קל׳
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {food.serving_size}{food.serving_unit}
                                                        </span>
                                                        {food.brand && (
                                                            <span className="text-xs text-slate-400 truncate">
                                                                {food.brand}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {/* Modern Star Button */}
                                                    <motion.button
                                                        onClick={() => toggleFavorite(food)}
                                                        className={cn(
                                                            "relative p-2.5 rounded-xl transition-all",
                                                            food.is_favorite
                                                                ? "text-amber-500"
                                                                : "text-slate-300 hover:text-amber-400"
                                                        )}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.85 }}
                                                        disabled={togglingFavorite === food.id}
                                                    >
                                                        {/* Glow effect */}
                                                        {food.is_favorite && (
                                                            <motion.div
                                                                className="absolute inset-0 rounded-xl bg-amber-400/20"
                                                                initial={{ scale: 0.8, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                            />
                                                        )}
                                                        <motion.div
                                                            animate={togglingFavorite === food.id ? {
                                                                rotate: [0, -15, 15, -10, 10, 0],
                                                                scale: [1, 1.2, 1.2, 1.1, 1.1, 1]
                                                            } : {}}
                                                            transition={{ duration: 0.4 }}
                                                        >
                                                            <Star
                                                                className={cn(
                                                                    "h-5 w-5 relative z-10 transition-all",
                                                                    food.is_favorite && "fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                                                )}
                                                            />
                                                        </motion.div>
                                                        {/* Sparkle particles when adding to favorites */}
                                                        <AnimatePresence>
                                                            {togglingFavorite === food.id && !food.is_favorite && (
                                                                <>
                                                                    {[...Array(6)].map((_, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            className="absolute w-1 h-1 rounded-full bg-amber-400"
                                                                            initial={{ scale: 0, x: 0, y: 0 }}
                                                                            animate={{
                                                                                scale: [0, 1, 0],
                                                                                x: Math.cos((i * 60) * Math.PI / 180) * 20,
                                                                                y: Math.sin((i * 60) * Math.PI / 180) * 20,
                                                                                opacity: [1, 1, 0]
                                                                            }}
                                                                            transition={{ duration: 0.4 }}
                                                                            style={{ left: '50%', top: '50%' }}
                                                                        />
                                                                    ))}
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.button>

                                                    {/* Add Button */}
                                                    <motion.button
                                                        onClick={() => addFoodToMeal(food)}
                                                        disabled={isAdding}
                                                        className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all disabled:opacity-50"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Plus className="h-5 w-5" />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                            {activeTab === 'favorites' ? (
                                                <Heart className="w-7 h-7 text-slate-300" />
                                            ) : activeTab === 'recent' ? (
                                                <Clock className="w-7 h-7 text-slate-300" />
                                            ) : (
                                                <Search className="w-7 h-7 text-slate-300" />
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-500">
                                            {activeTab === 'search' && !searchQuery ? (
                                                'הקלד לחיפוש מזון'
                                            ) : activeTab === 'search' && searchQuery && !isSearching ? (
                                                'לא נמצאו תוצאות'
                                            ) : activeTab === 'favorites' ? (
                                                'אין מועדפים עדיין'
                                            ) : (
                                                'אין פריטים אחרונים'
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {activeTab === 'favorites' && 'לחץ על הכוכב כדי להוסיף מועדפים'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Add Button */}
                            <div className="p-4 border-t border-slate-100">
                                <motion.button
                                    onClick={() => setShowQuickAdd(true)}
                                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 group"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <div className="p-1 rounded-lg bg-slate-200 group-hover:bg-green-100 transition-colors">
                                        <Plus className="h-4 w-4 group-hover:text-green-600 transition-colors" />
                                    </div>
                                    הוספה מהירה ידנית
                                </motion.button>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
