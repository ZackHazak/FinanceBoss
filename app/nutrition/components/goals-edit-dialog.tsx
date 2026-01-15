"use client"

import { useState, useEffect } from "react"
import { X, Target, Flame, Beef, Wheat, Droplet, Droplets, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { NutritionGoals } from "@/lib/types/nutrition"

interface GoalsEditDialogProps {
    isOpen: boolean
    onClose: () => void
    goals: NutritionGoals | null
    onSuccess: () => void
}

export function GoalsEditDialog({ isOpen, onClose, goals, onSuccess }: GoalsEditDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        calories_target: 2200,
        protein_target: 160,
        carbs_target: 220,
        fat_target: 70,
        water_target_ml: 2500
    })

    useEffect(() => {
        if (goals) {
            setFormData({
                calories_target: goals.calories_target,
                protein_target: goals.protein_target,
                carbs_target: goals.carbs_target,
                fat_target: goals.fat_target,
                water_target_ml: goals.water_target_ml
            })
        }
    }, [goals])

    const handleSave = async () => {
        setLoading(true)
        try {
            if (goals?.id) {
                // Update existing goals
                const { error } = await supabase
                    .from('nutrition_goals')
                    .update({
                        calories_target: formData.calories_target,
                        protein_target: formData.protein_target,
                        carbs_target: formData.carbs_target,
                        fat_target: formData.fat_target,
                        water_target_ml: formData.water_target_ml
                    })
                    .eq('id', goals.id)

                if (error) throw error
            } else {
                // Create new goals
                const { error } = await supabase
                    .from('nutrition_goals')
                    .insert({
                        calories_target: formData.calories_target,
                        protein_target: formData.protein_target,
                        carbs_target: formData.carbs_target,
                        fat_target: formData.fat_target,
                        water_target_ml: formData.water_target_ml,
                        is_active: true
                    })

                if (error) throw error
            }

            onSuccess()
            onClose()
        } catch (err) {
            console.error('Error saving goals:', err)
            alert('שגיאה בשמירת היעדים')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const fields = [
        {
            key: 'calories_target' as const,
            label: 'קלוריות',
            icon: Flame,
            iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
            unit: '',
            step: 50
        },
        {
            key: 'protein_target' as const,
            label: 'חלבון',
            icon: Beef,
            iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
            unit: 'g',
            step: 5
        },
        {
            key: 'carbs_target' as const,
            label: 'פחמימות',
            icon: Wheat,
            iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-500',
            unit: 'g',
            step: 5
        },
        {
            key: 'fat_target' as const,
            label: 'שומן',
            icon: Droplet,
            iconBg: 'bg-gradient-to-br from-yellow-500 to-lime-500',
            unit: 'g',
            step: 5
        },
        {
            key: 'water_target_ml' as const,
            label: 'מים',
            icon: Droplets,
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
            unit: 'ml',
            step: 100
        }
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Target className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">עריכת יעדים</h2>
                                <p className="text-white/80 text-sm">התאם את היעדים היומיים שלך</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {fields.map((field) => {
                        const Icon = field.icon
                        return (
                            <div
                                key={field.key}
                                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200"
                            >
                                <div className={`p-2.5 rounded-xl ${field.iconBg} shadow-md`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-600 block mb-1">
                                        {field.label}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={formData[field.key]}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                [field.key]: parseInt(e.target.value) || 0
                                            })}
                                            step={field.step}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-lg font-semibold text-slate-800"
                                        />
                                        {field.unit && (
                                            <span className="text-sm text-slate-500 min-w-[30px]">
                                                {field.unit}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                    >
                        ביטול
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span>שומר...</span>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                <span>שמור</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
