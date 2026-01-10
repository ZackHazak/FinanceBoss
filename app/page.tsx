import { BottomNav } from "@/components/bottom-nav"
import { Dashboard } from "@/components/dashboard"
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
        <main className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-md">
                <h1 className="text-xl font-bold tracking-tight">בוקר טוב 👋</h1>
                <p className="text-sm text-muted-foreground">הנה מה שקורה בחשבון שלך</p>
            </header>

            <Dashboard initialTransactions={txs} />

            <BottomNav />
        </main>
    )
}
