"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface TransactionContextType {
    // Counter that increments when transactions change
    updateTrigger: number
    // Call this when a transaction is added or deleted
    notifyTransactionChange: () => void
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export function TransactionProvider({ children }: { children: ReactNode }) {
    const [updateTrigger, setUpdateTrigger] = useState(0)

    const notifyTransactionChange = useCallback(() => {
        setUpdateTrigger(prev => prev + 1)
    }, [])

    return (
        <TransactionContext.Provider value={{ updateTrigger, notifyTransactionChange }}>
            {children}
        </TransactionContext.Provider>
    )
}

export function useTransactionUpdates() {
    const context = useContext(TransactionContext)
    if (!context) {
        throw new Error("useTransactionUpdates must be used within TransactionProvider")
    }
    return context
}
