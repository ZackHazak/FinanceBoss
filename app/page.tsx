import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components"
import { BottomNav } from "@/components/bottom-nav"
import { AddTransactionDialog } from "@/components/add-transaction-dialog"
import { supabase } from "@/lib/supabase"

export const revalidate = 0 // Disable caching for real-time feel

export default async function Home() {
    // Fetch transactions from Supabase
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching transactions:", error)
    }

    const txs = transactions || []

    // Calculate totals
    const balance = txs.reduce((acc, tx) => acc + Number(tx.amount), 0)
    const income = txs
        .filter(tx => tx.type === 'income')
        .reduce((acc, tx) => acc + Number(tx.amount), 0)
    const expense = txs
        .filter(tx => tx.type === 'expense')
        .reduce((acc, tx) => acc + Math.abs(Number(tx.amount)), 0)

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-md">
                <h1 className="text-xl font-bold tracking-tight">בוקר טוב 👋</h1>
                <p className="text-sm text-muted-foreground">הנה מה שקורה בחשבון שלך</p>
            </header>

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
                        {txs.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                אין תנועות עדיין. הוסף תנועה חדשה!
                            </p>
                        ) : (
                            txs.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:bg-accent/50"
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
                                    <span
                                        className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-foreground'}`}
                                        dir="ltr"
                                    >
                                        {tx.type === 'income' ? '+' : ''}₪{Math.abs(Number(tx.amount)).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </main>
    )
}
