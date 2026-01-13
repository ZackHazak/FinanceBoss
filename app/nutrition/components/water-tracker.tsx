"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Droplets, Plus, Minus, Waves } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { WaterLog } from "@/lib/types/nutrition"

interface WaterTrackerProps {
    logs: WaterLog[]
    target: number
    date: string
    onRefresh: () => void
}

const QUICK_ADD_AMOUNTS = [250, 500, 750]

export function WaterTracker({ logs, target, date, onRefresh }: WaterTrackerProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [customAmount, setCustomAmount] = useState('')
    const [lastAddedAmount, setLastAddedAmount] = useState<number | null>(null)

    const totalWater = logs.reduce((sum, log) => sum + Number(log.amount_ml), 0)
    const percentage = Math.min((totalWater / target) * 100, 100)
    const glasses = Math.floor(totalWater / 250)
    const isComplete = percentage >= 100

    async function addWater(amount: number) {
        setIsAdding(true)
        setLastAddedAmount(amount)
        try {
            const { error } = await supabase
                .from('water_logs')
                .insert({ date, amount_ml: amount })

            if (error) throw error
            onRefresh()
            setCustomAmount('')
        } catch (err) {
            console.error('Error adding water:', err)
        } finally {
            setIsAdding(false)
            setTimeout(() => setLastAddedAmount(null), 600)
        }
    }

    async function removeLastLog() {
        if (logs.length === 0) return

        const lastLog = logs[logs.length - 1]
        try {
            const { error } = await supabase
                .from('water_logs')
                .delete()
                .eq('id', lastLog.id)

            if (error) throw error
            onRefresh()
        } catch (err) {
            console.error('Error removing water log:', err)
        }
    }

    function handleCustomAdd() {
        const amount = parseInt(customAmount)
        if (amount > 0) {
            addWater(amount)
        }
    }

    // SVG calculations
    const size = 140
    const strokeWidth = 10
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius

    return (
        <motion.div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header with gradient */}
            <div className="relative px-4 pt-4 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <motion.div
                            className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20"
                            animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: isComplete ? Infinity : 0, duration: 2 }}
                        >
                            <Droplets className="h-4 w-4 text-white" />
                        </motion.div>
                        <h3 className="font-semibold text-slate-900">מים</h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Waves className="h-4 w-4 text-blue-400" />
                        <span>{glasses} כוסות</span>
                    </div>
                </div>
            </div>

            {/* Progress Circle */}
            <div className="flex flex-col items-center py-4 relative">
                {/* Floating bubbles animation when adding */}
                <AnimatePresence>
                    {lastAddedAmount && (
                        <>
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-blue-400/60"
                                    initial={{
                                        bottom: 60,
                                        left: `${40 + i * 5}%`,
                                        scale: 0
                                    }}
                                    animate={{
                                        bottom: 120 + i * 10,
                                        scale: [0, 1, 0.5, 0],
                                        opacity: [0, 1, 0.5, 0]
                                    }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                <div className="relative" style={{ width: size, height: size }}>
                    {/* Background gradient glow */}
                    <div
                        className={cn(
                            "absolute inset-2 rounded-full transition-all duration-500",
                            isComplete
                                ? "bg-gradient-to-br from-blue-100 to-cyan-100 shadow-lg shadow-blue-200"
                                : "bg-slate-50"
                        )}
                    />

                    <svg className="w-full h-full -rotate-90 relative z-10" viewBox={`0 0 ${size} ${size}`}>
                        {/* Background track */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth={strokeWidth}
                        />
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#0ea5e9" />
                            </linearGradient>
                            <filter id="waterGlow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {/* Progress arc */}
                        <motion.circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="url(#waterGradient)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: circumference * (1 - percentage / 100) }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            filter="url(#waterGlow)"
                        />
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <motion.span
                            className={cn(
                                "text-2xl font-bold",
                                isComplete ? "text-blue-600" : "text-slate-900"
                            )}
                            key={totalWater}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                        >
                            {totalWater >= 1000 ? `${(totalWater / 1000).toFixed(1)}L` : `${totalWater}ml`}
                        </motion.span>
                        <span className="text-xs text-slate-400">
                            מתוך {target >= 1000 ? `${target / 1000}L` : `${target}ml`}
                        </span>
                        {isComplete && (
                            <motion.span
                                className="text-[10px] text-blue-500 font-medium mt-1"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                🎉 יעד הושג!
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Percentage indicator */}
                <motion.div
                    className="mt-2 text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600"
                    animate={{ scale: lastAddedAmount ? [1, 1.1, 1] : 1 }}
                >
                    {Math.round(percentage)}%
                </motion.div>
            </div>

            {/* Quick Add Buttons */}
            <div className="px-4 pb-3">
                <div className="grid grid-cols-3 gap-2">
                    {QUICK_ADD_AMOUNTS.map((amount, index) => (
                        <motion.button
                            key={amount}
                            onClick={() => addWater(amount)}
                            disabled={isAdding}
                            className={cn(
                                "relative py-2.5 px-3 rounded-xl text-sm font-medium transition-all overflow-hidden",
                                "bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600",
                                "hover:from-blue-100 hover:to-cyan-100 hover:shadow-md hover:shadow-blue-100",
                                "disabled:opacity-50 disabled:hover:shadow-none",
                                "flex items-center justify-center gap-1.5"
                            )}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {amount}ml
                            {/* Ripple effect on click */}
                            {lastAddedAmount === amount && (
                                <motion.div
                                    className="absolute inset-0 bg-blue-400/20"
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Custom Amount */}
            <div className="px-4 pb-3">
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="כמות מותאמת (ml)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                    <motion.button
                        onClick={handleCustomAdd}
                        disabled={!customAmount || isAdding}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus className="h-5 w-5" />
                    </motion.button>
                </div>
            </div>

            {/* Remove Last Button */}
            <AnimatePresence>
                {logs.length > 0 && (
                    <motion.div
                        className="px-4 pb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <motion.button
                            onClick={removeLastLog}
                            className="w-full py-2.5 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-1.5 group"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Minus className="h-4 w-4 group-hover:rotate-180 transition-transform" />
                            הסר אחרון ({logs[logs.length - 1]?.amount_ml}ml)
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
