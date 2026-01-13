"use client"

import { useState, useEffect } from "react"
import { TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
    type Budget,
    type BudgetWithSpent,
    getCurrentMonthDate,
    getCategoryLabel
} from "@/lib/types/finance"

interface BudgetProgressProps {
    refreshTrigger?: number
}

export function BudgetProgress({ refreshTrigger }: BudgetProgressProps) {
    const [budgetsWithSpent, setBudgetsWithSpent] = useState<BudgetWithSpent[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchBudgetsWithSpending()
    }, [refreshTrigger])

    async function fetchBudgetsWithSpending() {
        setIsLoading(true)

        const currentMonth = getCurrentMonthDate()
        const monthDate = new Date(currentMonth)
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)

        // Fetch budgets for current month
        const { data: budgets, error: budgetError } = await supabase
            .from('budgets')
            .select('*')
            .eq('month', currentMonth)

        if (budgetError || !budgets) {
            setIsLoading(false)
            return
        }

        // Fetch expenses for current month grouped by category
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
        const combined: BudgetWithSpent[] = budgets.map(budget => {
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
        if (percentage >= 90) return 'bg-red-400'
        if (percentage >= 70) return 'bg-yellow-400'
        return 'bg-green-500'
    }

    function getStatusIcon(percentage: number) {
        if (percentage >= 90) {
            return <AlertTriangle className="h-4 w-4 text-red-500" />
        }
        if (percentage >= 100) {
            return <CheckCircle2 className="h-4 w-4 text-green-500" />
        }
        return null
    }

    if (isLoading) {
        return (
            <div className="glass rounded-3xl p-6">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
            </div>
        )
    }

    if (budgetsWithSpent.length === 0) {
        return null // Don't show if no budgets
    }

    const totalBudget = budgetsWithSpent.reduce((sum, b) => sum + Number(b.amount), 0)
    const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0)
    const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    return (
        <div className="glass rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/20">
                <div className="p-2.5 rounded-xl gradient-green shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">תקציב מול ביצוע</h3>
                    <p className="text-sm text-slate-500">
                        ₪{totalSpent.toLocaleString()} מתוך ₪{totalBudget.toLocaleString()} ({totalPercentage}%)
                    </p>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="divide-y divide-white/20">
                {budgetsWithSpent.map(budget => (
                    <div key={budget.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">
                                    {getCategoryLabel(budget.category, 'expense')}
                                </span>
                                {getStatusIcon(budget.percentage)}
                            </div>
                            <span className="text-sm text-slate-500">
                                ₪{budget.spent.toLocaleString()} / ₪{budget.amount.toLocaleString()}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-3 bg-white/40 rounded-full overflow-hidden">
                            <div
                                className={`absolute inset-y-0 right-0 ${getProgressColor(budget.percentage)} transition-all duration-500 rounded-full`}
                                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                            />
                            {budget.percentage > 100 && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-red-600 opacity-50 animate-pulse rounded-full"
                                    style={{ width: `${Math.min(budget.percentage - 100, 100)}%` }}
                                />
                            )}
                        </div>

                        {/* Percentage Label */}
                        <div className="flex justify-between mt-1.5">
                            <span className={`text-xs font-medium ${
                                budget.percentage >= 90 ? 'text-red-500' :
                                budget.percentage >= 70 ? 'text-amber-600' :
                                'text-emerald-600'
                            }`}>
                                {budget.percentage}% נוצל
                            </span>
                            {budget.percentage < 100 && (
                                <span className="text-xs text-slate-500">
                                    נותר: ₪{(budget.amount - budget.spent).toLocaleString()}
                                </span>
                            )}
                            {budget.percentage >= 100 && (
                                <span className="text-xs text-red-500 font-medium">
                                    חריגה: ₪{(budget.spent - budget.amount).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
