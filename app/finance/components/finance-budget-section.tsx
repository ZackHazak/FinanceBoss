"use client"

import { useState } from "react"
import { BudgetManager } from "./budget-manager"
import { BudgetProgress } from "./budget-progress"

export function FinanceBudgetSection() {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    function handleBudgetChange() {
        // Trigger refresh of BudgetProgress when budgets are modified
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <div className="px-4 md:px-6 py-6 space-y-6">
            {/* Budget vs Actual Progress */}
            <BudgetProgress refreshTrigger={refreshTrigger} />

            {/* Budget Manager */}
            <BudgetManager onBudgetChange={handleBudgetChange} />
        </div>
    )
}
