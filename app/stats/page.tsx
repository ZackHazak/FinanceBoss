"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-components"
import {
    Loader2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
    ChevronDown, ChevronUp, Trophy, CalendarCheck, ShoppingCart
} from "lucide-react"

// ==================== INTERFACES ====================

interface Transaction {
    id: string
    created_at: string
    amount: number
    description: string
    type: 'income' | 'expense'
    category: string
}

interface WeeklyStats {
    weekNumber: number
    weekStart: Date
    weekEnd: Date
    income: number
    expense: number
    net: number
    transactions: Transaction[]
    improvement: number | null
    isBestWeek: boolean
}

interface CategoryStats {
    category: string
    thisWeek: number
    lastWeek: number
    change: number | null
    transactions: Transaction[]
    weeklyHistory: number[] // Last 5 weeks
}

interface DailyData {
    date: string
    income: number
    expense: number
    balance: number
}

// ==================== HELPERS ====================

function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
}

function getWeekEnd(date: Date): Date {
    const start = getWeekStart(date)
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
}

function formatWeekRange(start: Date, end: Date): string {
    return `${start.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}`
}

// ==================== MINI SPARKLINE ====================

function MiniSparkline({ data }: { data: number[] }) {
    if (data.length < 2) return <span className="text-xs text-slate-400">-</span>

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const height = 24
    const width = 60

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((val - min) / range) * height
        return `${x},${y}`
    }).join(' ')

    const trend = data[data.length - 1] > data[0] ? 'up' : data[data.length - 1] < data[0] ? 'down' : 'flat'
    // For expenses: down is good (green), up is bad (red)
    const trendColor = trend === 'down' ? '#22c55e' : trend === 'up' ? '#ef4444' : '#64748b'

    return (
        <svg width={width} height={height} className="inline-block">
            <polyline
                fill="none"
                stroke={trendColor}
                strokeWidth="2"
                points={points}
            />
            <circle
                cx={(data.length - 1) / (data.length - 1) * width}
                cy={height - ((data[data.length - 1] - min) / range) * height}
                r="3"
                fill={trendColor}
            />
        </svg>
    )
}

// ==================== MAIN COMPONENT ====================

export default function StatsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: true })

        if (data) {
            setTransactions(data)
        } else if (error) {
            console.error("Error fetching transactions:", error)
        }
        setLoading(false)
    }

    // ==================== DATA PROCESSING ====================

    // Group transactions by week
    const weeklyStats: WeeklyStats[] = React.useMemo(() => {
        if (transactions.length === 0) return []

        const weekMap = new Map<number, Transaction[]>()

        transactions.forEach(tx => {
            const date = new Date(tx.created_at)
            const weekNum = getWeekNumber(date)
            const year = date.getFullYear()
            const key = year * 100 + weekNum // Unique key per week per year

            if (!weekMap.has(key)) {
                weekMap.set(key, [])
            }
            weekMap.get(key)!.push(tx)
        })

        const weeks: WeeklyStats[] = Array.from(weekMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([key, txs]) => {
                const firstTx = txs[0]
                const date = new Date(firstTx.created_at)
                const weekStart = getWeekStart(date)
                const weekEnd = getWeekEnd(date)

                const income = txs
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                const expense = txs
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

                return {
                    weekNumber: key % 100,
                    weekStart,
                    weekEnd,
                    income,
                    expense,
                    net: income - expense,
                    transactions: txs,
                    improvement: null,
                    isBestWeek: false
                }
            })

        // Calculate improvements and find best week
        let bestNetIndex = 0
        let bestNet = -Infinity

        weeks.forEach((week, idx) => {
            if (idx > 0) {
                const prevExpense = weeks[idx - 1].expense
                if (prevExpense > 0) {
                    week.improvement = ((prevExpense - week.expense) / prevExpense) * 100
                }
            }
            if (week.net > bestNet) {
                bestNet = week.net
                bestNetIndex = idx
            }
        })

        if (weeks.length > 0) {
            weeks[bestNetIndex].isBestWeek = true
        }

        return weeks
    }, [transactions])

    // Get current and previous week stats
    const currentWeek = weeklyStats.length > 0 ? weeklyStats[weeklyStats.length - 1] : null
    const previousWeek = weeklyStats.length > 1 ? weeklyStats[weeklyStats.length - 2] : null

    // Category stats with weekly breakdown
    const categoryStats: CategoryStats[] = React.useMemo(() => {
        if (transactions.length === 0) return []

        const now = new Date()
        const thisWeekStart = getWeekStart(now)
        const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Get expenses only
        const expenses = transactions.filter(t => t.type === 'expense')

        // Group by category
        const categoryMap = new Map<string, Transaction[]>()
        expenses.forEach(tx => {
            if (!categoryMap.has(tx.category)) {
                categoryMap.set(tx.category, [])
            }
            categoryMap.get(tx.category)!.push(tx)
        })

        return Array.from(categoryMap.entries()).map(([category, txs]) => {
            // This week total
            const thisWeekTxs = txs.filter(t => new Date(t.created_at) >= thisWeekStart)
            const thisWeek = thisWeekTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

            // Last week total
            const lastWeekTxs = txs.filter(t => {
                const d = new Date(t.created_at)
                return d >= lastWeekStart && d < thisWeekStart
            })
            const lastWeek = lastWeekTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

            // Weekly history (last 5 weeks)
            const weeklyHistory: number[] = []
            for (let i = 4; i >= 0; i--) {
                const weekStart = new Date(thisWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000)
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
                const weekTotal = txs
                    .filter(t => {
                        const d = new Date(t.created_at)
                        return d >= weekStart && d < weekEnd
                    })
                    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
                weeklyHistory.push(weekTotal)
            }

            const change = lastWeek > 0 ? ((lastWeek - thisWeek) / lastWeek) * 100 : null

            return {
                category,
                thisWeek,
                lastWeek,
                change,
                transactions: thisWeekTxs,
                weeklyHistory
            }
        }).sort((a, b) => b.thisWeek - a.thisWeek)
    }, [transactions])

    // Daily data for chart
    const dailyData: DailyData[] = React.useMemo(() => {
        if (transactions.length === 0) return []

        // Get last 30 days
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const dayMap = new Map<string, { income: number; expense: number }>()

        transactions
            .filter(t => new Date(t.created_at) >= thirtyDaysAgo)
            .forEach(tx => {
                const dateKey = new Date(tx.created_at).toLocaleDateString('he-IL')
                if (!dayMap.has(dateKey)) {
                    dayMap.set(dateKey, { income: 0, expense: 0 })
                }
                const day = dayMap.get(dateKey)!
                if (tx.type === 'income') {
                    day.income += Number(tx.amount)
                } else {
                    day.expense += Math.abs(Number(tx.amount))
                }
            })

        let runningBalance = 0
        return Array.from(dayMap.entries())
            .sort(([a], [b]) => {
                const dateA = a.split('/').reverse().join('-')
                const dateB = b.split('/').reverse().join('-')
                return dateA.localeCompare(dateB)
            })
            .map(([date, data]) => {
                runningBalance += data.income - data.expense
                return {
                    date,
                    income: data.income,
                    expense: data.expense,
                    balance: runningBalance
                }
            })
    }, [transactions])

    // Total balance
    const totalBalance = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

    // Balance change vs last week
    const balanceChange = React.useMemo(() => {
        if (!currentWeek || !previousWeek) return null
        return currentWeek.net - previousWeek.net
    }, [currentWeek, previousWeek])

    // ==================== RENDER ====================

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="mx-auto max-w-2xl p-6 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-2">
                    <Wallet className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">אין נתונים עדיין</h3>
                <p className="text-slate-500">
                    הוסף תנועות בדף הראשי כדי לראות סטטיסטיקות
                </p>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-4 md:space-y-6 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">דוחות פיננסיים</h1>

            {/* ==================== STATUS CARDS ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {/* Balance Card */}
                <Card className="bg-white shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-slate-600">יתרה כוללת</CardTitle>
                        <Wallet className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="text-xl md:text-2xl font-bold text-slate-900" dir="ltr">
                            ₪{totalBalance.toLocaleString()}
                        </div>
                        {balanceChange !== null && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${balanceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {balanceChange >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                {balanceChange >= 0 ? '+' : ''}₪{balanceChange.toLocaleString()} מהשבוע שעבר
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Weekly Expense Card */}
                <Card className="bg-white shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-slate-600">הוצאות השבוע</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2" dir="ltr">
                            ₪{(currentWeek?.expense || 0).toLocaleString()}
                            {currentWeek?.isBestWeek && <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />}
                        </div>
                        {currentWeek?.improvement !== null && currentWeek?.improvement !== undefined && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${currentWeek.improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {currentWeek.improvement > 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                ) : (
                                    <TrendingUp className="h-3 w-3" />
                                )}
                                {currentWeek.improvement > 0 ? '' : '+'}{Math.abs(currentWeek.improvement).toFixed(1)}% מהשבוע שעבר
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Weekly Income Card */}
                <Card className={`${(currentWeek?.income || 0) > (currentWeek?.expense || 0) ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'} shadow sm:col-span-2 md:col-span-1`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-slate-600">הכנסות השבוע</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="text-xl md:text-2xl font-bold text-green-700" dir="ltr">
                            ₪{(currentWeek?.income || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            נטו: <span className={currentWeek?.net && currentWeek.net >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'} dir="ltr">
                                ₪{(currentWeek?.net || 0).toLocaleString()}
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ==================== CASH FLOW CHART ==================== */}
            <Card className="bg-white shadow border-slate-200 p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-bold text-slate-900">מגמת תזרים מזומנים</h3>
                    <p className="text-xs md:text-sm text-slate-500">יתרה מצטברת ב-30 יום האחרונים</p>
                </div>
                <div className="h-[200px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `₪${(val / 1000).toFixed(0)}k`}
                                width={45}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                formatter={(value: number, name: string) => [
                                    `₪${value.toLocaleString()}`,
                                    name === 'balance' ? 'יתרה' : name === 'income' ? 'הכנסות' : 'הוצאות'
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ fill: '#2563eb', strokeWidth: 1, r: 3, stroke: '#fff' }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* ==================== CATEGORY BREAKDOWN ==================== */}
            <div className="space-y-3">
                <h3 className="text-base md:text-lg font-bold text-slate-900 px-1">התפלגות לפי קטגוריה</h3>

                <div className="space-y-2">
                    {categoryStats.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-8">אין הוצאות השבוע</p>
                    ) : (
                        categoryStats.map((cat) => {
                            const isExpanded = expandedCategory === cat.category
                            const maxAmount = Math.max(...categoryStats.map(c => c.thisWeek)) || 1

                            return (
                                <div
                                    key={cat.category}
                                    className="rounded-xl border bg-white shadow-sm overflow-hidden border-slate-200"
                                >
                                    {/* Category Header */}
                                    <div
                                        className="p-4 cursor-pointer active:bg-slate-50 hover:bg-slate-50/50 transition-colors"
                                        onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{cat.category}</span>
                                                {cat.change !== null && cat.change > 20 && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">
                                                        <Trophy className="h-3 w-3" /> חיסכון
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MiniSparkline data={cat.weeklyHistory} />
                                                {isExpanded ? (
                                                    <ChevronUp className="h-5 w-5 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-mono font-semibold text-slate-700" dir="ltr">
                                                ₪{cat.thisWeek.toLocaleString()}
                                            </span>
                                            {cat.change !== null && (
                                                <span className={`text-sm font-bold ${cat.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {cat.change > 0 ? '-' : '+'}{Math.abs(cat.change).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                                style={{ width: `${(cat.thisWeek / maxAmount) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                                            {/* Week Comparison */}
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <h5 className="font-semibold text-blue-800 text-xs mb-2">השוואה שבועית</h5>
                                                <div className="flex justify-between text-sm">
                                                    <div>
                                                        <span className="text-blue-600 text-xs">השבוע: </span>
                                                        <span className="font-bold text-blue-900" dir="ltr">₪{cat.thisWeek.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-600 text-xs">שבוע שעבר: </span>
                                                        <span className="font-bold text-blue-900" dir="ltr">₪{cat.lastWeek.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Transactions List */}
                                            <h5 className="font-semibold text-slate-700 text-sm">תנועות השבוע</h5>
                                            {cat.transactions.length === 0 ? (
                                                <p className="text-xs text-slate-500">אין תנועות השבוע</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {cat.transactions.map((tx) => (
                                                        <div
                                                            key={tx.id}
                                                            className="bg-white rounded-lg p-3 border border-slate-200"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-medium text-slate-800 text-sm truncate block">{tx.description}</span>
                                                                    <span className="text-xs text-slate-500">
                                                                        {new Date(tx.created_at).toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <span className="font-semibold text-slate-700" dir="ltr">
                                                                    ₪{Math.abs(Number(tx.amount)).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* ==================== WEEKLY HISTORY ==================== */}
            <div className="space-y-3">
                <h3 className="text-base md:text-lg font-bold text-slate-900 px-1">היסטוריה שבועית</h3>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {[...weeklyStats].reverse().slice(0, 8).map((week) => {
                        const isExpanded = expandedWeek === week.weekNumber

                        return (
                            <div
                                key={week.weekNumber}
                                className={`rounded-xl border bg-white shadow-sm overflow-hidden ${week.isBestWeek ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}
                            >
                                <div
                                    className="p-4 cursor-pointer active:bg-slate-50"
                                    onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">שבוע {week.weekNumber}</span>
                                            {week.isBestWeek && <Trophy className="h-4 w-4 text-amber-500" />}
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">
                                            {formatWeekRange(week.weekStart, week.weekEnd)}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono font-semibold ${week.net >= 0 ? 'text-green-600' : 'text-red-500'}`} dir="ltr">
                                                {week.net >= 0 ? '+' : ''}₪{week.net.toLocaleString()}
                                            </span>
                                            {week.improvement !== null && (
                                                <span className={`text-xs font-bold ${week.improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {week.improvement > 0 ? '-' : '+'}{Math.abs(week.improvement).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                                <span className="text-xs text-green-600">הכנסות</span>
                                                <div className="font-bold text-green-700" dir="ltr">₪{week.income.toLocaleString()}</div>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                                <span className="text-xs text-red-600">הוצאות</span>
                                                <div className="font-bold text-red-700" dir="ltr">₪{week.expense.toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {week.transactions.length} תנועות
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block rounded-lg border bg-white shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                                <tr>
                                    <th className="px-4 py-3 w-8"></th>
                                    <th className="px-4 py-3">שבוע</th>
                                    <th className="px-4 py-3">תאריכים</th>
                                    <th className="px-4 py-3">הכנסות</th>
                                    <th className="px-4 py-3">הוצאות</th>
                                    <th className="px-4 py-3">נטו</th>
                                    <th className="px-4 py-3">שינוי</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[...weeklyStats].reverse().slice(0, 12).map((week) => {
                                    const isExpanded = expandedWeek === week.weekNumber

                                    return (
                                        <React.Fragment key={week.weekNumber}>
                                            <tr
                                                className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${week.isBestWeek ? 'bg-amber-50/30' : ''}`}
                                                onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                                            >
                                                <td className="px-4 py-3">
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-slate-400" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold">שבוע {week.weekNumber}</span>
                                                        {week.isBestWeek && <Trophy className="h-4 w-4 text-amber-500" />}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {formatWeekRange(week.weekStart, week.weekEnd)}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-green-600" dir="ltr">
                                                    ₪{week.income.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-red-500" dir="ltr">
                                                    ₪{week.expense.toLocaleString()}
                                                </td>
                                                <td className={`px-4 py-3 font-mono font-bold ${week.net >= 0 ? 'text-green-600' : 'text-red-500'}`} dir="ltr">
                                                    {week.net >= 0 ? '+' : ''}₪{week.net.toLocaleString()}
                                                </td>
                                                <td className={`px-4 py-3 font-bold ${!week.improvement ? 'text-slate-400' : week.improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {week.improvement !== null ? `${week.improvement > 0 ? '-' : '+'}${Math.abs(week.improvement).toFixed(1)}%` : '-'}
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-4 bg-slate-50/50">
                                                        <div className="space-y-3">
                                                            <h4 className="font-semibold text-slate-700 text-sm">תנועות השבוע</h4>
                                                            <div className="grid gap-2 max-h-48 overflow-y-auto">
                                                                {week.transactions.map((tx) => (
                                                                    <div
                                                                        key={tx.id}
                                                                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 shadow-sm"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`rounded-full p-1.5 ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                                {tx.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-medium text-slate-800 text-sm">{tx.description}</span>
                                                                                <div className="text-xs text-slate-500">
                                                                                    {new Date(tx.created_at).toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: '2-digit' })} • {tx.category}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <span className={`font-mono font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-slate-700'}`} dir="ltr">
                                                                            {tx.type === 'income' ? '+' : ''}₪{Math.abs(Number(tx.amount)).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
