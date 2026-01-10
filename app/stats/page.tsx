"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface Transaction {
    id: string
    amount: number
    type: 'income' | 'expense'
    category: string
}

export default function ReportsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('transactions').select('*')
            if (data) setTransactions(data)
            setLoading(false)
        }
        fetch()
    }, [])

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    // Group expenses by category
    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount))
            return acc
        }, {} as Record<string, number>)

    const sortedCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)

    const maxCategoryAmount = Math.max(...Object.values(expensesByCategory), 0) || 1

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6 pb-24">
            <h1 className="text-2xl font-bold">דוחות פיננסיים</h1>

            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50/50 dark:bg-green-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-600 font-medium">הכנסות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700" dir="ltr">
                            ₪{income.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50/50 dark:bg-red-900/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-600 font-medium">הוצאות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700" dir="ltr">
                            ₪{expense.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>התפלגות הוצאות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sortedCategories.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">אין נתונים להצגה</p>
                    ) : (
                        sortedCategories.map(([category, amount]) => (
                            <div key={category} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{category}</span>
                                    <span>₪{amount.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${(amount / (income || expense || 1)) * 100}%` }} // Simplified relative bar
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
