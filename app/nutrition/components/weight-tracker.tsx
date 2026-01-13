"use client"

import { useState, useEffect } from "react"
import { Scale, TrendingDown, TrendingUp, Minus, Edit2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { WeightLog } from "@/lib/types/nutrition"

interface WeightTrackerProps {
    log: WeightLog | null
    date: string
    onRefresh: () => void
}

export function WeightTracker({ log, date, onRefresh }: WeightTrackerProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [weight, setWeight] = useState('')
    const [notes, setNotes] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [previousWeight, setPreviousWeight] = useState<number | null>(null)

    useEffect(() => {
        if (log) {
            setWeight(log.weight_kg.toString())
            setNotes(log.notes || '')
        } else {
            setWeight('')
            setNotes('')
        }
        fetchPreviousWeight()
    }, [log, date])

    async function fetchPreviousWeight() {
        const { data } = await supabase
            .from('weight_logs')
            .select('weight_kg')
            .lt('date', date)
            .order('date', { ascending: false })
            .limit(1)
            .single()

        setPreviousWeight(data?.weight_kg ?? null)
    }

    async function handleSave() {
        if (!weight) return

        setIsSaving(true)
        try {
            if (log) {
                // Update existing
                const { error } = await supabase
                    .from('weight_logs')
                    .update({ weight_kg: parseFloat(weight), notes })
                    .eq('id', log.id)

                if (error) throw error
            } else {
                // Insert new
                const { error } = await supabase
                    .from('weight_logs')
                    .insert({ date, weight_kg: parseFloat(weight), notes })

                if (error) throw error
            }

            setIsEditing(false)
            onRefresh()
        } catch (err) {
            console.error('Error saving weight:', err)
        } finally {
            setIsSaving(false)
        }
    }

    const weightDiff = log && previousWeight
        ? Number(log.weight_kg) - previousWeight
        : null

    const TrendIcon = weightDiff === null ? Minus :
        weightDiff > 0 ? TrendingUp :
            weightDiff < 0 ? TrendingDown : Minus

    const trendColor = weightDiff === null ? 'text-slate-400' :
        weightDiff > 0 ? 'text-red-500' :
            weightDiff < 0 ? 'text-green-500' : 'text-slate-400'

    return (
        <div className="bg-white rounded-xl border shadow-sm p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-slate-900">משקל</h3>
                </div>
                {log && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isEditing || !log ? (
                /* Edit Mode */
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">משקל (ק״ג)</label>
                        <input
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold text-center"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-500 block mb-1">הערות (אופציונלי)</label>
                        <input
                            type="text"
                            placeholder="לפני ארוחת בוקר, אחרי אימון..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        {log && (
                            <button
                                onClick={() => {
                                    setIsEditing(false)
                                    setWeight(log.weight_kg.toString())
                                    setNotes(log.notes || '')
                                }}
                                className="flex-1 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                ביטול
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!weight || isSaving}
                            className="flex-1 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'שומר...' : 'שמור'}
                        </button>
                    </div>
                </div>
            ) : (
                /* Display Mode */
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-bold text-slate-900">
                            {Number(log.weight_kg).toFixed(1)}
                        </span>
                        <span className="text-lg text-slate-400">ק״ג</span>
                    </div>

                    {weightDiff !== null && (
                        <div className={`flex items-center justify-center gap-1 ${trendColor}`}>
                            <TrendIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} ק״ג
                            </span>
                            <span className="text-xs text-slate-400">מהמדידה הקודמת</span>
                        </div>
                    )}

                    {log.notes && (
                        <p className="mt-2 text-xs text-slate-500">{log.notes}</p>
                    )}
                </div>
            )}
        </div>
    )
}
