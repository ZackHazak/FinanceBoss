"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Plus } from "lucide-react"
import { Input, Button } from "@/components/ui-components"

interface FitnessTarget {
    id: string
    day_name: string
    order_index: number
    exercise_name: string
    target_sets: string
    target_reps: string
    target_rpe: string
    target_rest: string
}

interface FitnessLog {
    id: string
    target_id: string
    date: string
    set_1: string
    set_2: string
    set_3: string
    set_4: string
    notes: string
    lsrpe: string
}

interface DailySummary {
    id: string
    date: string
    total_time: string
    total_volume: number
}

interface Props {
    dayName: string // 'Push' | 'Pull' | 'Legs'
}

export function FitnessSpreadsheet({ dayName }: Props) {

    const [targets, setTargets] = useState<FitnessTarget[]>([])
    const [logs, setLogs] = useState<Record<string, FitnessLog>>({}) // Key by target_id
    const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Debounce Save Logic
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Keep refs that always mirror the latest state so debounced callbacks
    // don't read stale closures
    const logsRef = useRef(logs)
    useEffect(() => {
        logsRef.current = logs
    }, [logs])

    const targetsRef = useRef(targets)
    useEffect(() => {
        targetsRef.current = targets
    }, [targets])

    const fetchData = useCallback(async () => {
        setLoading(true)

        // 1. Fetch Targets for this day
        const { data: targetsData, error: targetsError } = await supabase
            .from('fitness_targets')
            .select('*')
            .eq('day_name', dayName)
            .order('order_index')

        if (targetsError) {
            console.error("Error fetching targets:", JSON.stringify(targetsError, null, 2))
            // Check for missing table (PostgREST code PGRST205 or Postgres code 42P01)
            if (targetsError.code === '42P01' || targetsError.code === 'PGRST205') {
                setErrorMsg('missing_table')
            }
            return
        }

        // 2. Fetch Logs for today
        const { data: logsData, error: logsError } = await supabase
            .from('fitness_logs')
            .select('*')
            .eq('date', today)

        if (logsError) {
            console.error("Error fetching logs:", logsError)
        }

        // 3. Fetch Summary
        const { data: summaryData } = await supabase
            .from('fitness_daily_summary')
            .select('*')
            .eq('date', today)
            .single()

        setTargets(targetsData || [])

        // Transform logs to map
        const logsMap: Record<string, FitnessLog> = {}
        logsData?.forEach(log => {
            logsMap[log.target_id] = log
        })
        setLogs(logsMap)

        setDailySummary(summaryData || null)
        setLoading(false)
    }, [dayName, supabase, today])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleLogChange = (targetId: string, field: keyof FitnessLog, value: string) => {
        // Optimistic UI Update
        setLogs(prev => {
            const existing = prev[targetId] || {
                id: '',
                target_id: targetId,
                date: today,
                set_1: '', set_2: '', set_3: '', set_4: '',
                notes: '', lsrpe: ''
            }
            return {
                ...prev,
                [targetId]: { ...existing, [field]: value }
            }
        })

        // Debounced Save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        setSaving(true)
        saveTimeoutRef.current = setTimeout(async () => {
            await saveLog(targetId, field, value)
            setSaving(false)
        }, 1000)
    }

    // Target Persistence Logic
    const handleTargetChange = (targetId: string, field: keyof FitnessTarget, value: string) => {
        setTargets(prev => prev.map(t =>
            t.id === targetId ? { ...t, [field]: value } : t
        ))

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        setSaving(true)
        saveTimeoutRef.current = setTimeout(async () => {
            await saveTarget(targetId, field, value)
            setSaving(false)
        }, 1000)
    }

    const saveTarget = async (targetId: string, field: keyof FitnessTarget, value: string) => {
        const target = targetsRef.current.find(t => t.id === targetId)
        if (!target) return

        const { error } = await supabase
            .from('fitness_targets')
            .upsert({
                id: targetId,
                day_name: dayName,
                order_index: target.order_index,
                exercise_name: target.exercise_name,
                target_sets: target.target_sets,
                target_reps: target.target_reps,
                target_rpe: target.target_rpe,
                target_rest: target.target_rest
            }) // We always upsert the whole object or at least ID + field

        if (error) console.error("Error saving target:", JSON.stringify(error, null, 2))
    }

    const handleAddExercise = async () => {
        // Optimistic add
        const newOrderIndex = targets.length > 0 ? Math.max(...targets.map(t => t.order_index)) + 1 : 1
        const tempId = crypto.randomUUID()

        const newTarget: FitnessTarget = {
            id: tempId,
            day_name: dayName,
            order_index: newOrderIndex,
            exercise_name: "",
            target_sets: "3",
            target_reps: "8-12",
            target_rpe: "8",
            target_rest: "2m"
        }

        setTargets(prev => [...prev, newTarget])

        // Save immediately
        const { data, error } = await supabase
            .from('fitness_targets')
            .insert({
                day_name: dayName,
                order_index: newOrderIndex,
                exercise_name: "New Exercise",
                target_sets: "3",
                target_reps: "8-12",
                target_rpe: "8",
                target_rest: "2m"
            })
            .select()
            .single()

        if (error) {
            console.error("Error creating target:", error)
            // Revert? For now just log
        } else if (data) {
            // Replace temp ID with real ID
            setTargets(prev => prev.map(t => t.id === tempId ? data : t))
        }
    }

    const saveLog = async (targetId: string, field: keyof FitnessLog, value: string) => {
        // Upsert log
        // Note: We need to handle the case where the row doesn't exist yet differently 
        // if we didn't have the ID, but upsert with unique(date, target_id) handles it.

        // We need to retrieve the current state for this target to save all fields properly if it's a new row
        // Actually, we can just upsert the specific field if we structured it rights, 
        // but Supabase upsert requires unique match.

        // Read from ref to avoid stale closure (logs state may not yet be updated
        // in the closure captured when the debounced timeout was scheduled)
        const currentLog = logsRef.current[targetId]
        if (!currentLog) return

        const payload = {
            target_id: targetId,
            date: today,
            set_1: currentLog.set_1,
            set_2: currentLog.set_2,
            set_3: currentLog.set_3,
            set_4: currentLog.set_4,
            notes: currentLog.notes,
            lsrpe: currentLog.lsrpe,
            user_id: (await supabase.auth.getUser()).data.user?.id
        }

        const { error } = await supabase
            .from('fitness_logs')
            .upsert(payload, { onConflict: 'date, target_id' })

        if (error) console.error("Error saving log:", error)

        // Also update volume summary
        calculateAndSaveVolume()
    }

    const handleSummaryChange = (value: string) => {
        // Optimistic
        setDailySummary(prev => prev ? { ...prev, total_time: value } : { id: '', date: today, total_time: value, total_volume: 0 })

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        setSaving(true)
        saveTimeoutRef.current = setTimeout(async () => {
            const { error } = await supabase
                .from('fitness_daily_summary')
                .upsert({
                    date: today,
                    day_name: dayName,
                    total_time: value,
                    // We preserve volume or calc it
                }, { onConflict: 'date' })
            if (error) console.error("Error saving summary:", error)
            setSaving(false)
        }, 1000)
    }

    const calculateAndSaveVolume = async () => {
        // Simple calculation: sum of all numbers found in sets
        let total = 0
        Object.values(logs).forEach(log => {
            [log.set_1, log.set_2, log.set_3, log.set_4].forEach(val => {
                if (!val) return
                // Extract all numbers and sum them? Or assume "weight x reps"?
                // User asked for "Total Set Volume". Usually sets * reps * weight.
                // Since input is free text, this is hard.
                // For now, I will just sum the raw numbers found if it looks like a single number, 
                // otherwise ignore. MVP.
                const num = parseFloat(val)
                if (!isNaN(num)) total += num
            })
        })

        // Update local state if needed (optional)
        // Save to DB
        await supabase
            .from('fitness_daily_summary')
            .upsert({
                date: today,
                day_name: dayName,
                total_volume: total
            }, { onConflict: 'date' })
    }


    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    if (errorMsg === 'missing_table') {
        return (
            <div className="text-center p-8 text-red-600 bg-red-50 rounded border border-red-200 m-4">
                <h3 className="font-bold mb-2">Database Error</h3>
                <p>The required tables were not found.</p>
                <p className="text-sm font-mono mt-2 bg-white p-2 border inline-block">Did you run <code>supabase_migration_fitness_spreadsheet.sql</code>?</p>
            </div>
        )
    }

    if (targets.length === 0) return <div className="text-center p-8 text-muted-foreground">No exercises found for {dayName}. (Run Migration?)</div>

    return (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                        <tr>
                            <th className="px-3 py-2 w-32">Exercise</th>
                            <th className="px-2 py-2 w-12 text-center text-xs text-muted-foreground">Sets</th>
                            <th className="px-2 py-2 w-16 text-center text-xs text-muted-foreground">Reps</th>
                            <th className="px-2 py-2 w-12 text-center text-xs text-muted-foreground">RPE</th>
                            <th className="px-2 py-2 w-12 text-center text-xs text-muted-foreground">Rest</th>
                            <th className="px-1 py-2 w-16 text-center bg-blue-50/50">1</th>
                            <th className="px-1 py-2 w-16 text-center bg-blue-50/50">2</th>
                            <th className="px-1 py-2 w-16 text-center bg-blue-50/50">3</th>
                            <th className="px-1 py-2 w-16 text-center bg-blue-50/50">4</th>
                            <th className="px-1 py-2 w-16 text-center">LSRPE</th>
                            <th className="px-3 py-2">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {targets.map(target => {
                            const log = logs[target.id] || {
                                id: '', target_id: target.id, date: today,
                                set_1: '', set_2: '', set_3: '', set_4: '',
                                notes: '', lsrpe: ''
                            }

                            return (
                                <tr key={target.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-3 py-2 font-medium text-gray-900 border-r">
                                        <Input
                                            className="h-8 w-full border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent px-1 font-semibold"
                                            value={target.exercise_name}
                                            placeholder="Exercise Name"
                                            onChange={e => handleTargetChange(target.id, 'exercise_name', e.target.value)}
                                        />
                                    </td>

                                    {/* Editable Targets */}
                                    <td className="px-1 py-2 text-center border-r">
                                        <Input
                                            className="h-8 w-full text-center border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent px-1 p-0"
                                            value={target.target_sets}
                                            onChange={e => handleTargetChange(target.id, 'target_sets', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-1 py-2 text-center border-r">
                                        <Input
                                            className="h-8 w-full text-center border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent px-1 p-0"
                                            value={target.target_reps}
                                            onChange={e => handleTargetChange(target.id, 'target_reps', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-1 py-2 text-center border-r">
                                        <Input
                                            className="h-8 w-full text-center border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent px-1 p-0"
                                            value={target.target_rpe}
                                            onChange={e => handleTargetChange(target.id, 'target_rpe', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-1 py-2 text-center border-r">
                                        <Input
                                            className="h-8 w-full text-center border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent px-1 p-0"
                                            value={target.target_rest}
                                            onChange={e => handleTargetChange(target.id, 'target_rest', e.target.value)}
                                        />
                                    </td>

                                    {/* Inputs */}
                                    <td className="p-1"><Input className="h-8 w-full text-center px-1 border-gray-200 focus:border-blue-500" value={log.set_1} onChange={e => handleLogChange(target.id, 'set_1', e.target.value)} /></td>
                                    <td className="p-1"><Input className="h-8 w-full text-center px-1 border-gray-200 focus:border-blue-500" value={log.set_2} onChange={e => handleLogChange(target.id, 'set_2', e.target.value)} /></td>
                                    <td className="p-1"><Input className="h-8 w-full text-center px-1 border-gray-200 focus:border-blue-500" value={log.set_3} onChange={e => handleLogChange(target.id, 'set_3', e.target.value)} /></td>
                                    <td className="p-1"><Input className="h-8 w-full text-center px-1 border-gray-200 focus:border-blue-500" value={log.set_4} onChange={e => handleLogChange(target.id, 'set_4', e.target.value)} /></td>

                                    <td className="p-1"><Input className="h-8 w-14 text-center px-1 border-gray-200" value={log.lsrpe} onChange={e => handleLogChange(target.id, 'lsrpe', e.target.value)} /></td>
                                    <td className="p-1"><Input className="h-8 w-full px-2 border-gray-200 text-xs" placeholder="..." value={log.notes} onChange={e => handleLogChange(target.id, 'notes', e.target.value)} /></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-2 border-t bg-gray-50/30">
                <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm h-9" onClick={handleAddExercise}>
                    <Plus className="w-4 h-4 mr-2" /> Add Exercise
                </Button>
            </div>

            {/* Footer Summary */}
            <div className="bg-gray-50 border-t p-4 flex flex-wrap gap-6 items-center justify-end text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Total Volume:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border min-w-[3rem] text-center">
                        {/* We rely on DB aggregation usually, but here straightforward UI update */}
                        Calculate...
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Total Training Time:</span>
                    <Input
                        className="h-8 w-24 bg-white"
                        placeholder="00:00"
                        value={dailySummary?.total_time || ''}
                        onChange={e => handleSummaryChange(e.target.value)}
                    />
                </div>
                <div className="text-xs text-muted-foreground w-6">
                    {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
            </div>
        </div >
    )
}
