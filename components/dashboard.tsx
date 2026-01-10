"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react" // Added Trash2
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui-components"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { supabase } from "@/lib/supabase"

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
            }
        }
    }

    return (
        <div className="space-y-6 p-6">
            {/* Balance Card */}
            <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium opacity-80">יתרה זמינה</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold tracking-tighter" dir="ltr">
                        ₪{balance.toLocaleString()}
                    </div>
                    <div className="mt-4 flex gap-4 text-xs font-medium opacity-90">
                        <div className="flex items-center gap-1">
                            <div className="rounded-full bg-green-500/20 p-1">
                                <ArrowUpRight className="h-3 w-3 text-green-400" />
                            </div>
                            <span>הכנסות: ₪{income.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="rounded-full bg-red-500/20 p-1">
                                <ArrowDownRight className="h-3 w-3 text-red-400" />
                            </div>
                            <span>הוצאות: ₪{expense.toLocaleString()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <AddTransactionDialog />
            </div>

            {/* Recent Transactions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">תנועות אחרונות</h2>
                </div>

                <div className="space-y-3">
                    {transactions.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            אין תנועות עדיין. הוסף תנועה חדשה!
                        </p>
                    ) : (
                        transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:bg-accent/50 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`rounded-full p-2 ${tx.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                                        {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="font-medium leading-none">{tx.description}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleDateString("he-IL")} • {tx.category}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-foreground'}`}
                                        dir="ltr"
                                    >
                                        {tx.type === 'income' ? '+' : ''}₪{Math.abs(Number(tx.amount)).toLocaleString()}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(tx.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
