"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, ArrowDownRight, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui-components"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { supabase } from "@/lib/supabase"
import { useTransactionUpdates } from "@/lib/contexts/transaction-context"

interface Transaction {
    id: string
    created_at: string
    amount: number
    description: string
    type: 'income' | 'expense'
    category: string
}

interface DashboardProps {
    initialTransactions: Transaction[]
}

export function Dashboard({ initialTransactions }: DashboardProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
    const { notifyTransactionChange } = useTransactionUpdates()

    useEffect(() => {
        setTransactions(initialTransactions)
    }, [initialTransactions])

    // Calculate totals
    const balance = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0)
    const income = transactions
        .filter(tx => tx.type === 'income')
        .reduce((acc, tx) => acc + Number(tx.amount), 0)
    const expense = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((acc, tx) => acc + Math.abs(Number(tx.amount)), 0)

    const handleDelete = async (id: string) => {
        if (window.confirm("האם אתה בטוח שברצונך למחוק תנועה זו?")) {
            // Optimistic update
            const previousTransactions = [...transactions]
            setTransactions(transactions.filter(tx => tx.id !== id))

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (error) {
                console.error("Error deleting transaction:", error)
                alert("שגיאה במחיקת התנועה")
                setTransactions(previousTransactions) // Revert on error
            } else {
                notifyTransactionChange() // Notify expense tracker to refresh
            }
        }
    }

    return (
        <div className="space-y-6 p-6">
            {/* Balance Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white shadow-xl">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-2xl" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                            <Wallet className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-white/70">יתרה זמינה</span>
                    </div>

                    <div className="text-4xl font-bold tracking-tight mb-6" dir="ltr">
                        ₪{balance.toLocaleString()}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                                </div>
                                <span className="text-xs text-white/60">הכנסות</span>
                            </div>
                            <p className="text-lg font-semibold text-emerald-400" dir="ltr">
                                ₪{income.toLocaleString()}
                            </p>
                        </div>
                        <div className="flex-1 rounded-2xl bg-white/10 backdrop-blur-sm p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 rounded-lg bg-red-500/20">
                                    <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                                </div>
                                <span className="text-xs text-white/60">הוצאות</span>
                            </div>
                            <p className="text-lg font-semibold text-red-400" dir="ltr">
                                ₪{expense.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <AddTransactionDialog />
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">תנועות אחרונות</h2>
                </div>

                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <div className="glass rounded-2xl p-8 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl glass-light flex items-center justify-center">
                                <Wallet className="h-7 w-7 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">
                                אין תנועות עדיין. הוסף תנועה חדשה!
                            </p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="glass-card rounded-2xl p-4 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${
                                            tx.type === 'income'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-red-100 text-red-500'
                                        }`}>
                                            {tx.type === 'income'
                                                ? <ArrowUpRight className="h-4 w-4" />
                                                : <ArrowDownRight className="h-4 w-4" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{tx.description}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {new Date(tx.created_at).toLocaleDateString("he-IL")} • {tx.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`font-bold text-lg ${
                                                tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                                            }`}
                                            dir="ltr"
                                        >
                                            {tx.type === 'income' ? '+' : ''}₪{Math.abs(Number(tx.amount)).toLocaleString()}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => handleDelete(tx.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
