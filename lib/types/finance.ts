// Finance Module Types

export interface Transaction {
    id: string
    created_at: string
    amount: number
    description: string
    type: 'income' | 'expense'
    category: string
}

export interface Budget {
    id: string
    category: string
    amount: number
    month: string // ISO date string (first day of month)
    created_at: string
}

export interface BudgetWithSpent extends Budget {
    spent: number
    percentage: number
}

// Predefined expense categories
export const EXPENSE_CATEGORIES = [
    { value: 'food', label: 'מזון' },
    { value: 'rent', label: 'שכירות' },
    { value: 'entertainment', label: 'בילויים' },
    { value: 'transport', label: 'תחבורה' },
    { value: 'shopping', label: 'קניות' },
    { value: 'bills', label: 'חשבונות' },
    { value: 'health', label: 'בריאות' },
    { value: 'other', label: 'אחר' },
] as const

export const INCOME_CATEGORIES = [
    { value: 'salary', label: 'משכורת' },
    { value: 'freelance', label: 'פרילנס' },
    { value: 'investment', label: 'השקעות' },
    { value: 'gift', label: 'מתנה' },
    { value: 'other', label: 'אחר' },
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]['value']
export type IncomeCategory = typeof INCOME_CATEGORIES[number]['value']

// Helper to get category label
export function getCategoryLabel(categoryValue: string, type: 'income' | 'expense'): string {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    const found = categories.find(c => c.value === categoryValue)
    return found?.label || categoryValue
}

// Helper to get current month as ISO date (first day)
export function getCurrentMonthDate(): string {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

// Helper to format month for display
export function formatMonthHebrew(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
}
