"use client"

import { Dashboard } from "@/components/dashboard"
import { FinanceBudgetSection } from "./finance-budget-section"
import { TransactionProvider } from "@/lib/contexts/transaction-context"

interface Transaction {
    id: string
    created_at: string
    amount: number
    description: string
    type: 'income' | 'expense'
    category: string
}

interface FinanceContentProps {
    initialTransactions: Transaction[]
}

export function FinanceContent({ initialTransactions }: FinanceContentProps) {
    return (
        <TransactionProvider>
            <Dashboard initialTransactions={initialTransactions} />
            <FinanceBudgetSection />
        </TransactionProvider>
    )
}
