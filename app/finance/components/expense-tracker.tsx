"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, X, Loader2, Wallet, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
    EXPENSE_CATEGORIES,
    type Budget,
    type BudgetWithSpent,
    getCurrentMonthDate,
    formatMonthHebrew,
    getCategoryLabel
} from "@/lib/types/finance"

export function ExpenseTracker() {
    const [budgetsWithSpent, setBudgetsWithSpent] = useState<BudgetWithSpent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isExpanded, setIsExpanded] = useState(true)
    const currentMonth = getCurrentMonthDate()

    const [formData, setFormData] = useState({
        category: 'food',
        amount: '',
        customCategory: ''
    })
    const [showCustomInput, setShowCustomInput] = useState(false)

    useEffect(() => {
        fetchBudgetsWithSpending()
    }, [])

    async function fetchBudgetsWithSpending() {
        setIsLoading(true)

        const monthDate = new Date(currentMonth)
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)

        // Fetch budgets for current month
        const { data: budgets, error: budgetError } = await supabase
            .from('budgets')
            .select('*')
            .eq('month', currentMonth)
            .order('category')

        if (budgetError) {
            setIsLoading(false)
            return
        }

        // Fetch expenses for current month
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('category, amount')
            .eq('type', 'expense')
            .gte('created_at', startOfMonth.toISOString())
            .lte('created_at', endOfMonth.toISOString())

        if (txError) {
            setIsLoading(false)
            return
        }

        // Calculate spending per category
        const spendingByCategory: Record<string, number> = {}
        transactions?.forEach(tx => {
            const category = tx.category
            const amount = Math.abs(Number(tx.amount))
            spendingByCategory[category] = (spendingByCategory[category] || 0) + amount
        })

        // Combine budgets with spending
        const combined: BudgetWithSpent[] = (budgets || []).map(budget => {
            const spent = spendingByCategory[budget.category] || 0
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
            return {
                ...budget,
                spent,
                percentage: Math.round(percentage)
            }
        })

        // Sort by percentage (highest first)
        combined.sort((a, b) => b.percentage - a.percentage)

        setBudgetsWithSpent(combined)
        setIsLoading(false)
    }

    function getProgressColor(percentage: number): string {
        if (percentage >= 100) return 'bg-red-500'
        if (percentage >= 90) return 'bg-amber-500'
        if (percentage >= 70) return 'bg-yellow-400'
        return 'bg-emerald-500'
    }

    function getTextColor(percentage: number): string {
        if (percentage >= 90) return 'text-red-600'
        if (percentage >= 70) return 'text-amber-600'
        return 'text-emerald-600'
    }

    function openAddModal() {
        const usedCategories = budgetsWithSpent.map(b => b.category)
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

    function openEditModal(budget: BudgetWithSpent) {
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

            await fetchBudgetsWithSpending()
            closeModal()
        } catch (err) {
            console.error('Error saving budget:', err)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(budget: BudgetWithSpent) {
        if (!confirm(`למחוק את יעד ההוצאה של "${getCategoryLabel(budget.category, 'expense')}"?`)) return

        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', budget.id)

        if (!error) {
            setBudgetsWithSpent(prev => prev.filter(b => b.id !== budget.id))
        }
    }

    const availableCategories = EXPENSE_CATEGORIES.filter(
        c => !budgetsWithSpent.some(b => b.category === c.value) || editingBudget?.category === c.value
    )

    const totalBudget = budgetsWithSpent.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0)
    const totalRemaining = totalBudget - totalSpent
    const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    if (isLoading) {
        return (
            <div className="glass rounded-3xl p-8">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
            </div>
        )
    }

    return (
        <div className="glass rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl gradient-green shadow-lg">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">מעקב הוצאות</h3>
                            <p className="text-sm text-slate-500">{formatMonthHebrew(currentMonth)}</p>
                        </div>
                    </div>
                    <button
                        onClick={openAddModal}
                        disabled={availableCategories.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 gradient-blue text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="h-4 w-4" />
                        יעד חדש
                    </button>
                </div>

                {/* Summary Card */}
                {budgetsWithSpent.length > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-600 font-medium">סיכום חודשי</span>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-slate-400" />
                                )}
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden mb-3">
                            <div
                                className={`absolute inset-y-0 right-0 ${getProgressColor(totalPercentage)} transition-all duration-700 rounded-full`}
                                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                            />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">יעד הוצאות</p>
                                <p className="font-bold text-slate-800">₪{totalBudget.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">הוצאתי</p>
                                <p className={`font-bold ${getTextColor(totalPercentage)}`}>
                                    ₪{totalSpent.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">
                                    {totalRemaining >= 0 ? 'נותר' : 'חריגה'}
                                </p>
                                <p className={`font-bold ${totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    ₪{Math.abs(totalRemaining).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Categories List */}
            {budgetsWithSpent.length === 0 ? (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass-light flex items-center justify-center">
                        <Wallet className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium mb-1">אין יעדי הוצאות עדיין</p>
                    <p className="text-slate-500 text-sm mb-4">הגדר יעדים לקטגוריות כדי לעקוב אחרי ההוצאות שלך</p>
                    <button
                        onClick={openAddModal}
                        className="text-blue-600 text-sm font-medium hover:underline"
                    >
                        הוסף יעד ראשון
                    </button>
                </div>
            ) : isExpanded && (
                <div className="divide-y divide-white/20">
                    {budgetsWithSpent.map(budget => (
                        <div
                            key={budget.id}
                            className="p-4 hover:bg-white/30 transition-colors group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-700">
                                        {getCategoryLabel(budget.category, 'expense')}
                                    </span>
                                    {budget.percentage >= 90 && (
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold ${getTextColor(budget.percentage)}`}>
                                        {budget.percentage}%
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(budget)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(budget)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`absolute inset-y-0 right-0 ${getProgressColor(budget.percentage)} transition-all duration-500 rounded-full`}
                                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                />
                            </div>

                            {/* Info Row */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    ₪{budget.spent.toLocaleString()} מתוך ₪{budget.amount.toLocaleString()}
                                </span>
                                {budget.percentage < 100 ? (
                                    <span className="text-emerald-600 font-medium">
                                        נותר: ₪{(budget.amount - budget.spent).toLocaleString()}
                                    </span>
                                ) : (
                                    <span className="text-red-600 font-medium">
                                        חריגה: ₪{(budget.spent - budget.amount).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
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
                                {editingBudget ? 'ערוך יעד הוצאה' : 'יעד הוצאה חדש'}
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
                                    {!editingBudget && <option value="_custom">מותאם אישית...</option>}
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
                                    יעד הוצאה חודשי (₪)
                                </label>
                                <input
                                    type="number"
                                    placeholder="לדוגמה: 2000"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full px-4 py-3 glass-input rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    הסכום המקסימלי שתרצה להוציא בקטגוריה זו החודש
                                </p>
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
