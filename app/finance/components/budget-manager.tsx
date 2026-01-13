"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, X, Loader2, PiggyBank } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
    EXPENSE_CATEGORIES,
    type Budget,
    getCurrentMonthDate,
    formatMonthHebrew,
    getCategoryLabel
} from "@/lib/types/finance"

interface BudgetManagerProps {
    onBudgetChange?: () => void
}

export function BudgetManager({ onBudgetChange }: BudgetManagerProps) {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(getCurrentMonthDate())

    const [formData, setFormData] = useState({
        category: 'food',
        amount: '',
        customCategory: ''
    })
    const [showCustomInput, setShowCustomInput] = useState(false)

    useEffect(() => {
        fetchBudgets()
    }, [currentMonth])

    async function fetchBudgets() {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('month', currentMonth)
            .order('category')

        if (!error && data) {
            setBudgets(data)
        }
        setIsLoading(false)
    }

    function openAddModal() {
        // Find first category without a budget
        const usedCategories = budgets.map(b => b.category)
        const availableCategory = EXPENSE_CATEGORIES.find(c => !usedCategories.includes(c.value))

        setFormData({
            category: availableCategory?.value || 'food',
            amount: '',
            customCategory: ''
        })
        setShowCustomInput(false)
        setEditingBudget(null)
        setIsModalOpen(true)
    }

    function openEditModal(budget: Budget) {
        // Check if this is a custom category (not in predefined list)
        const isCustom = !EXPENSE_CATEGORIES.some(c => c.value === budget.category)
        setFormData({
            category: isCustom ? '_custom' : budget.category,
            amount: String(budget.amount),
            customCategory: isCustom ? budget.category : ''
        })
        setShowCustomInput(isCustom)
        setEditingBudget(budget)
        setIsModalOpen(true)
    }

    function closeModal() {
        setIsModalOpen(false)
        setEditingBudget(null)
    }

    async function handleSave() {
        if (!formData.amount || Number(formData.amount) <= 0) return

        // Use custom category if selected
        const finalCategory = showCustomInput && formData.customCategory.trim()
            ? formData.customCategory.trim()
            : formData.category

        setIsSaving(true)
        try {
            const budgetData = {
                category: finalCategory,
                amount: Number(formData.amount),
                month: currentMonth
            }

            if (editingBudget) {
                const { error } = await supabase
                    .from('budgets')
                    .update(budgetData)
                    .eq('id', editingBudget.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('budgets')
                    .upsert(budgetData, { onConflict: 'category,month' })

                if (error) throw error
            }

            await fetchBudgets()
            onBudgetChange?.()
            closeModal()
        } catch (err) {
            console.error('Error saving budget:', err)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(budget: Budget) {
        if (!confirm(`למחוק את התקציב של "${getCategoryLabel(budget.category, 'expense')}"?`)) return

        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', budget.id)

        if (!error) {
            setBudgets(prev => prev.filter(b => b.id !== budget.id))
            onBudgetChange?.()
        }
    }

    // Get categories that don't have a budget yet
    const availableCategories = EXPENSE_CATEGORIES.filter(
        c => !budgets.some(b => b.category === c.value) || editingBudget?.category === c.value
    )

    return (
        <div className="glass rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl gradient-blue shadow-lg">
                        <PiggyBank className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">תקציב חודשי</h3>
                        <p className="text-sm text-slate-500">{formatMonthHebrew(currentMonth)}</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    disabled={availableCategories.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 gradient-blue text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                    <Plus className="h-4 w-4" />
                    הוסף
                </button>
            </div>

            {/* Budgets List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
            ) : budgets.length === 0 ? (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass-light flex items-center justify-center">
                        <PiggyBank className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">אין תקציבים עדיין</p>
                    <button
                        onClick={openAddModal}
                        className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                    >
                        הגדר תקציב ראשון
                    </button>
                </div>
            ) : (
                <div className="divide-y divide-white/20">
                    {budgets.map(budget => (
                        <div
                            key={budget.id}
                            className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors group"
                        >
                            <div>
                                <p className="font-medium text-slate-700">
                                    {getCategoryLabel(budget.category, 'expense')}
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                    ₪{budget.amount.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(budget)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-xl transition-colors"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(budget)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100/50 rounded-xl transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Total */}
            {budgets.length > 0 && (
                <div className="p-4 border-t border-white/20 glass-light">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">סה״כ תקציב:</span>
                        <span className="text-xl font-bold text-slate-800">
                            ₪{budgets.reduce((sum, b) => sum + Number(b.amount), 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
                    <div className="glass-modal w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl sm:m-4 max-h-[85vh] overflow-y-auto">
                        {/* Mobile drag handle */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-slate-300 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between p-5 pt-2 sm:pt-5 border-b border-white/20">
                            <h3 className="font-bold text-slate-800 text-lg">
                                {editingBudget ? 'ערוך תקציב' : 'הוסף תקציב'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-white/30 rounded-xl transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    קטגוריה
                                </label>
                                <select
                                    value={showCustomInput ? '_custom' : formData.category}
                                    onChange={(e) => {
                                        if (e.target.value === '_custom') {
                                            setShowCustomInput(true)
                                            setFormData(prev => ({ ...prev, category: '_custom' }))
                                        } else {
                                            setShowCustomInput(false)
                                            setFormData(prev => ({ ...prev, category: e.target.value, customCategory: '' }))
                                        }
                                    }}
                                    disabled={!!editingBudget}
                                    className="w-full px-4 py-3 glass-input rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-60"
                                >
                                    {(editingBudget ? EXPENSE_CATEGORIES : availableCategories).map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                    {!editingBudget && <option value="_custom">✏️ מותאם אישית...</option>}
                                    {editingBudget && showCustomInput && (
                                        <option value="_custom">{formData.customCategory}</option>
                                    )}
                                </select>
                                {showCustomInput && !editingBudget && (
                                    <input
                                        type="text"
                                        placeholder="הזן שם קטגוריה"
                                        value={formData.customCategory}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                                        className="w-full mt-2 px-4 py-3 glass-input rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                        autoFocus
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    סכום (₪)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full px-4 py-3 glass-input rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="p-5 pb-8 sm:pb-5 border-t border-white/20 flex gap-3" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 glass-button text-slate-600 font-medium rounded-xl hover:bg-white/50 transition-all"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.amount || Number(formData.amount) <= 0 || isSaving || (showCustomInput && !formData.customCategory.trim())}
                                className="flex-1 py-3 gradient-blue text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'שמור'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
