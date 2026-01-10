"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ArrowUpRight, ArrowDownRight, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui-components"

interface Transaction {
    id: string
    created_at: string
    amount: number
    description: string
    type: 'income' | 'expense'
    category: string
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setTransactions(data)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("האם אתה בטוח שברצונך למחוק תנועה זו?")) {
            setTransactions(prev => prev.filter(tx => tx.id !== id))
            await supabase.from('transactions').delete().eq('id', id)
        }
    }

    // Grouping Logic
    const groupedTransactions = transactions.reduce((groups, tx) => {
        const date = new Date(tx.created_at).toLocaleDateString("he-IL")
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(tx)
        return groups
    }, {} as Record<string, Transaction[]>)

    return (
        <div className="mx-auto max-w-2xl p-6 pb-24">
            <h1 className="mb-6 text-2xl font-bold">היסטוריית תנועות</h1>

            {loading ? (
                <div className="text-center text-muted-foreground">טוען...</div>
            ) : transactions.length === 0 ? (
                <div className="text-center text-muted-foreground">אין תנועות להצגה</div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedTransactions).map(([date, txs]) => (
                        <div key={date} className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {date}
                            </div>
                            {txs.map((tx) => (
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
                                            <p className="mt-1 text-xs text-muted-foreground">{tx.category}</p>
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
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
