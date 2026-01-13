"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Plus, Search, Star, Pencil, Trash2, X, Loader2, UtensilsCrossed } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { Food } from "@/lib/types/nutrition"

export default function MyFoodsPage() {
    const [foods, setFoods] = useState<Food[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'favorites'>('all')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingFood, setEditingFood] = useState<Food | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        name_he: '',
        brand: '',
        serving_size: '100',
        serving_unit: 'g',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        sugar: '',
    })

    useEffect(() => {
        fetchFoods()
    }, [])

    async function fetchFoods() {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('foods')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setFoods(data)
        }
        setIsLoading(false)
    }

    function resetForm() {
        setFormData({
            name: '',
            name_he: '',
            brand: '',
            serving_size: '100',
            serving_unit: 'g',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            fiber: '',
            sugar: '',
        })
    }

    function openAddModal() {
        resetForm()
        setEditingFood(null)
        setIsAddModalOpen(true)
    }

    function openEditModal(food: Food) {
        setFormData({
            name: food.name,
            name_he: food.name_he || '',
            brand: food.brand || '',
            serving_size: String(food.serving_size),
            serving_unit: food.serving_unit,
            calories: String(food.calories),
            protein: String(food.protein),
            carbs: String(food.carbs),
            fat: String(food.fat),
            fiber: String(food.fiber || ''),
            sugar: String(food.sugar || ''),
        })
        setEditingFood(food)
        setIsAddModalOpen(true)
    }

    function closeModal() {
        setIsAddModalOpen(false)
        setEditingFood(null)
        resetForm()
    }

    async function handleSave() {
        if (!formData.name.trim()) return

        setIsSaving(true)
        try {
            const foodData = {
                name: formData.name.trim(),
                name_he: formData.name_he.trim() || null,
                brand: formData.brand.trim() || null,
                serving_size: Number(formData.serving_size) || 100,
                serving_unit: formData.serving_unit,
                calories: Number(formData.calories) || 0,
                protein: Number(formData.protein) || 0,
                carbs: Number(formData.carbs) || 0,
                fat: Number(formData.fat) || 0,
                fiber: Number(formData.fiber) || 0,
                sugar: Number(formData.sugar) || 0,
                api_source: 'manual' as const,
            }

            if (editingFood) {
                const { error } = await supabase
                    .from('foods')
                    .update(foodData)
                    .eq('id', editingFood.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('foods')
                    .insert(foodData)

                if (error) throw error
            }

            await fetchFoods()
            closeModal()
        } catch (err) {
            console.error('Error saving food:', err)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(food: Food) {
        if (!confirm(`למחוק את "${food.name}"?`)) return

        const { error } = await supabase
            .from('foods')
            .delete()
            .eq('id', food.id)

        if (!error) {
            setFoods(prev => prev.filter(f => f.id !== food.id))
        }
    }

    async function toggleFavorite(food: Food) {
        setTogglingFavorite(food.id)
        const { error } = await supabase
            .from('foods')
            .update({ is_favorite: !food.is_favorite })
            .eq('id', food.id)

        if (!error) {
            setFoods(prev => prev.map(f =>
                f.id === food.id ? { ...f, is_favorite: !f.is_favorite } : f
            ))
        }
        setTimeout(() => setTogglingFavorite(null), 300)
    }

    const filteredFoods = foods.filter(food => {
        const matchesSearch = !searchQuery ||
            food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            food.name_he?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            food.brand?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = filter === 'all' || food.is_favorite

        return matchesSearch && matchesFilter
    })

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-slate-50/50 pb-24 md:pb-8">
            {/* Header */}
            <motion.div
                className="flex items-center gap-4 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link
                    href="/nutrition"
                    className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                    <ArrowRight className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/20">
                            <UtensilsCrossed className="h-5 w-5 text-white" />
                        </div>
                        המזונות שלי
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">נהל את רשימת המזונות האישית שלך</p>
                </div>
                <motion.button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">הוסף מזון</span>
                </motion.button>
            </motion.div>

            {/* Search & Filter */}
            <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="חפש מזון..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white border-2 border-transparent rounded-xl focus:border-green-500 focus:outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-all",
                            filter === 'all'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        )}
                    >
                        הכל ({foods.length})
                    </button>
                    <button
                        onClick={() => setFilter('favorites')}
                        className={cn(
                            "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5",
                            filter === 'favorites'
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                        )}
                    >
                        <Star className={cn("h-4 w-4", filter === 'favorites' && "fill-current")} />
                        מועדפים
                    </button>
                </div>
            </motion.div>

            {/* Foods List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
            ) : filteredFoods.length === 0 ? (
                <motion.div
                    className="bg-white rounded-2xl border p-8 text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">
                        {searchQuery ? 'לא נמצאו תוצאות' : 'אין מזונות עדיין'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={openAddModal}
                            className="mt-4 text-green-600 font-medium hover:underline"
                        >
                            הוסף את המזון הראשון שלך
                        </button>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredFoods.map((food, index) => (
                            <motion.div
                                key={food.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.02 }}
                                className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors border-b last:border-b-0 group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-800 truncate">
                                            {food.name}
                                        </p>
                                        {food.name_he && food.name !== food.name_he && (
                                            <span className="text-sm text-slate-400">({food.name_he})</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                            {food.serving_size}{food.serving_unit}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                                            {Math.round(food.calories)} קל׳
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                                            ח: {food.protein}g
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-500">
                                            פ: {food.carbs}g
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">
                                            ש: {food.fat}g
                                        </span>
                                        {food.brand && (
                                            <span className="text-xs text-slate-400">| {food.brand}</span>
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
                                        title={food.is_favorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
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
                                        {/* Sparkle particles */}
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

                                    <motion.button
                                        onClick={() => openEditModal(food)}
                                        className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="ערוך"
                                    >
                                        <Pencil className="h-5 w-5" />
                                    </motion.button>
                                    <motion.button
                                        onClick={() => handleDelete(food)}
                                        className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="מחק"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl"
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-1 md:hidden">
                                <div className="w-10 h-1 rounded-full bg-slate-300" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingFood ? 'ערוך מזון' : 'הוסף מזון חדש'}
                                </h2>
                                <motion.button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </motion.button>
                            </div>

                            {/* Form */}
                            <div className="p-5 space-y-4 overflow-y-auto">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        שם המזון (אנגלית) *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Chicken Breast"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        שם בעברית
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="חזה עוף"
                                        value={formData.name_he}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name_he: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">
                                        מותג (אופציונלי)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="למשל: תנובה"
                                        value={formData.brand}
                                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">גודל מנה</label>
                                        <input
                                            type="number"
                                            placeholder="100"
                                            value={formData.serving_size}
                                            onChange={(e) => setFormData(prev => ({ ...prev, serving_size: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-slate-700">יחידה</label>
                                        <select
                                            value={formData.serving_unit}
                                            onChange={(e) => setFormData(prev => ({ ...prev, serving_unit: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="g">גרם (g)</option>
                                            <option value="ml">מ״ל (ml)</option>
                                            <option value="piece">יחידה</option>
                                            <option value="cup">כוס</option>
                                            <option value="tbsp">כף</option>
                                            <option value="tsp">כפית</option>
                                            <option value="slice">פרוסה</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-3 border-t">
                                    <p className="text-sm font-medium text-slate-700 mb-3">ערכים תזונתיים (למנה)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'calories', label: 'קלוריות' },
                                            { key: 'protein', label: 'חלבון (g)' },
                                            { key: 'carbs', label: 'פחמימות (g)' },
                                            { key: 'fat', label: 'שומן (g)' },
                                            { key: 'fiber', label: 'סיבים (g)' },
                                            { key: 'sugar', label: 'סוכר (g)' },
                                        ].map(field => (
                                            <div key={field.key} className="space-y-1">
                                                <label className="block text-xs text-slate-500">{field.label}</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={formData[field.key as keyof typeof formData]}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:outline-none transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t flex gap-3">
                                <motion.button
                                    onClick={closeModal}
                                    className="flex-1 py-3 border-2 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    ביטול
                                </motion.button>
                                <motion.button
                                    onClick={handleSave}
                                    disabled={!formData.name.trim() || isSaving}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        editingFood ? 'שמור שינויים' : 'הוסף מזון'
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
