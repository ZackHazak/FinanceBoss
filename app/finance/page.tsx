import { FinanceContent } from "./components/finance-content"
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

    return (
        <main className="min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 glass-header px-6 py-4">
                <h1 className="text-xl font-bold tracking-tight text-slate-800">בוקר טוב 👋</h1>
                <p className="text-sm text-slate-500">הנה מה שקורה בחשבון שלך</p>
            </header>

            <FinanceContent initialTransactions={txs} />
        </main>
    )
}
