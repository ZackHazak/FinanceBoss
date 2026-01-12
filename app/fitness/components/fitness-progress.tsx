"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components"
import { Loader2, TrendingUp, AlertCircle, Dumbbell, CalendarCheck } from "lucide-react"
import { WORKOUT_PROGRAMS, type WorkoutType } from "@/app/body/workout-data"

interface RawWorkoutLog {
    id: string
    created_at: string
    workout_type: WorkoutType
    exercises_data: {
        exercise: string
        weight: number
        completed: boolean
    }[]
}

interface ProcessedSession {
    id: string
    date: string
    day_name: string
    total_volume: number
    weekNumber: number
    isDeload: boolean
    improvement: number | null
}

const parseReps = (reps: number | string): number => {
    if (typeof reps === 'number') return reps
    // "10-12" -> 11
    if (typeof reps === 'string' && reps.includes('-')) {
        const [min, max] = reps.split('-').map(Number)
        return (min + max) / 2
    }
    return parseFloat(reps) || 0
}

export function FitnessProgress() {
    const [sessions, setSessions] = useState<ProcessedSession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data, error } = await supabase
            .from('ppl_workouts')
            .select('*')
            .order('created_at', { ascending: true }) // Oldest first

        if (data) {
            processData(data)
        } else if (error) {
            console.error("Error fetching workouts:", error)
        }
        setLoading(false)
    }

    const processData = (data: RawWorkoutLog[]) => {
        console.log("Raw Data Fetch:", data)
        const processed: ProcessedSession[] = data.map((log, index) => {
            const weekNumber = Math.floor(index / 3) + 1
            const isDeload = weekNumber % 8 === 0

            // Calculate Volume
            const program = WORKOUT_PROGRAMS[log.workout_type]
            if (!program) console.warn("Program not found for type:", log.workout_type)

            let total_volume = 0

            if (program && log.exercises_data) {
                log.exercises_data.forEach(loggedEx => {
                    // Calculate volume for all exercises with weight (regardless of completed status)
                    if (loggedEx.weight > 0) {
                        // Find matching exercise def (Case insensitive & trimmed)
                        const def = program.exercises.find(e =>
                            e.name.trim().toLowerCase() === loggedEx.exercise.trim().toLowerCase()
                        )

                        if (def) {
                            const reps = parseReps(def.reps)
                            const weight = loggedEx.weight || 0
                            const exerciseVolume = (def.sets * reps * weight)
                            total_volume += exerciseVolume
                        }
                    }
                })
            }

            return {
                id: log.id,
                date: log.created_at,
                day_name: log.workout_type,
                total_volume,
                weekNumber,
                isDeload,
                improvement: null // Calc next
            }
        })

        // Calculate improvement
        processed.forEach((session, idx) => {
            if (idx > 0) {
                const prev = processed[idx - 1]
                if (prev.total_volume > 0) {
                    session.improvement = ((session.total_volume - prev.total_volume) / prev.total_volume) * 100
                }
            }
        })

        setSessions(processed)
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    if (sessions.length === 0) return (
        <div className="text-center p-8 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-2">
                <Dumbbell className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No workouts logged yet</h3>
            <p className="text-slate-500">
                Go to the <span className="font-bold text-red-500">Body</span> module to log your first workout!
            </p>
        </div>
    )

    const currentSession = sessions[sessions.length - 1]
    const currentWeek = currentSession.weekNumber
    const isDeloadWeek = currentWeek % 8 === 0
    const weeksUntilDeload = 8 - (currentWeek % 8)

    // Reverse for table display (Newest first)
    const tableSessions = [...sessions].reverse()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Current Phase</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">Training Week {currentWeek}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {isDeloadWeek ? (
                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> DELOAD WEEK
                                </span>
                            ) : (
                                <span>{weeksUntilDeload === 8 ? 0 : weeksUntilDeload} weeks until Deload</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Last Volume</CardTitle>
                        <Dumbbell className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{currentSession.total_volume.toLocaleString()} kg</div>
                        <p className={`text-xs mt-1 flex items-center gap-1 ${currentSession.improvement && currentSession.improvement > 0 ? 'text-green-600' : 'text-slate-500'
                            }`}>
                            {currentSession.improvement ? (
                                <>
                                    <TrendingUp className={`h-3 w-3 ${currentSession.improvement < 0 ? 'rotate-180 text-red-500' : ''}`} />
                                    {Math.abs(currentSession.improvement).toFixed(1)}% {currentSession.improvement > 0 ? 'increase' : 'decrease'}
                                </>
                            ) : "First workout"}
                        </p>
                    </CardContent>
                </Card>

                <Card className={`${isDeloadWeek ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} shadow`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${isDeloadWeek ? 'text-amber-700' : 'text-blue-700'}`}>
                            {isDeloadWeek ? "Deload Advice" : "Training Focus"}
                        </CardTitle>
                        <AlertCircle className={`h-4 w-4 ${isDeloadWeek ? 'text-amber-600' : 'text-blue-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-sm font-semibold ${isDeloadWeek ? 'text-amber-900' : 'text-blue-900'}`}>
                            {isDeloadWeek
                                ? "Reduce intensity by 50%. Focus on technique and mobility."
                                : "Aim for progressive overload (increase weight or reps)."}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Volume Chart */}
            <Card className="bg-white shadow border-slate-200 p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Volume Progression</h3>
                    <p className="text-sm text-slate-500">Total volume lifted per workout session (Body Module)</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sessions}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Volume']}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('he-IL', { dateStyle: 'medium' })}
                            />
                            <Line
                                type="monotone"
                                dataKey="total_volume"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Progress Table */}
            <div className="rounded-lg border bg-white shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Workout</th>
                                <th className="px-4 py-3 text-center">Week #</th>
                                <th className="px-4 py-3 text-right">Volume</th>
                                <th className="px-4 py-3 text-right">Improvement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tableSessions.map((session) => (
                                <tr key={session.id} className={`hover:bg-slate-50/50 ${session.isDeload ? 'bg-amber-50/30' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {new Date(session.date).toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{session.day_name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${session.isDeload ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            W{session.weekNumber}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                                        {session.total_volume.toLocaleString()}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${!session.improvement ? 'text-slate-400' :
                                        session.improvement > 0 ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                        {session.improvement ? `${session.improvement > 0 ? '+' : ''}${session.improvement.toFixed(1)}%` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
