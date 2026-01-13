"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components"
import { Loader2, TrendingUp, AlertCircle, Dumbbell, CalendarCheck, ChevronDown, ChevronUp, Trophy } from "lucide-react"
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

interface ExerciseHistory {
    date: string
    weight: number
}

interface ExerciseData {
    name: string
    currentWeight: number
    history: ExerciseHistory[]
    isPR: boolean
    previousWorkout: { weight: number; date: string } | null
}

interface ProcessedSession {
    id: string
    date: string
    day_name: string
    total_volume: number
    weekNumber: number
    isDeload: boolean
    improvement: number | null
    isPR: boolean
    exercises: ExerciseData[]
    rawExercises: { exercise: string; weight: number; completed: boolean }[]
}

const parseReps = (reps: number | string): number => {
    if (typeof reps === 'number') return reps
    if (typeof reps === 'string' && reps.includes('-')) {
        const [min, max] = reps.split('-').map(Number)
        return (min + max) / 2
    }
    return parseFloat(reps) || 0
}

// Mini Sparkline component
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
    const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#64748b'

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

export function FitnessProgress() {
    const [sessions, setSessions] = useState<ProcessedSession[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedSession, setExpandedSession] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data, error } = await supabase
            .from('ppl_workouts')
            .select('*')
            .order('created_at', { ascending: true })

        if (data) {
            processData(data)
        } else if (error) {
            console.error("Error fetching workouts:", error)
        }
        setLoading(false)
    }

    const processData = (data: RawWorkoutLog[]) => {
        // Build exercise history map for PR detection and sparklines
        const exerciseHistoryMap: Record<string, { weight: number; date: string; volume: number }[]> = {}

        data.forEach(log => {
            log.exercises_data?.forEach(ex => {
                const key = `${log.workout_type}-${ex.exercise.toLowerCase().trim()}`
                if (!exerciseHistoryMap[key]) {
                    exerciseHistoryMap[key] = []
                }
                const program = WORKOUT_PROGRAMS[log.workout_type]
                const def = program?.exercises.find(e =>
                    e.name.trim().toLowerCase() === ex.exercise.trim().toLowerCase()
                )
                const reps = def ? parseReps(def.reps) : 10
                const volume = ex.weight * reps * (def?.sets || 1)

                exerciseHistoryMap[key].push({
                    weight: ex.weight,
                    date: log.created_at,
                    volume
                })
            })
        })

        // Track max weights for PR detection
        const maxWeightMap: Record<string, number> = {}
        const maxVolumeMap: Record<string, number> = {}

        const processed: ProcessedSession[] = data.map((log, index) => {
            const weekNumber = Math.floor(index / 3) + 1
            const isDeload = weekNumber % 8 === 0

            const program = WORKOUT_PROGRAMS[log.workout_type]
            let total_volume = 0
            let sessionIsPR = false
            const exercises: ExerciseData[] = []

            if (program && log.exercises_data) {
                log.exercises_data.forEach(loggedEx => {
                    const key = `${log.workout_type}-${loggedEx.exercise.toLowerCase().trim()}`
                    const def = program.exercises.find(e =>
                        e.name.trim().toLowerCase() === loggedEx.exercise.trim().toLowerCase()
                    )

                    if (def && loggedEx.weight > 0) {
                        const reps = parseReps(def.reps)
                        const exerciseVolume = def.sets * reps * loggedEx.weight
                        total_volume += exerciseVolume

                        // Check if this is a PR (personal record)
                        const currentMax = maxWeightMap[key] || 0
                        const isPR = loggedEx.weight > currentMax && currentMax > 0
                        if (loggedEx.weight > currentMax) {
                            maxWeightMap[key] = loggedEx.weight
                        }
                        if (isPR) sessionIsPR = true

                        // Get history for sparkline (last 5 workouts of same type)
                        const history = exerciseHistoryMap[key]
                            ?.slice(0, exerciseHistoryMap[key].findIndex(h => h.date === log.created_at) + 1)
                            .slice(-5)
                            .map(h => ({ date: h.date, weight: h.weight })) || []

                        // Find previous workout for comparison
                        const allHistory = exerciseHistoryMap[key] || []
                        const currentIndex = allHistory.findIndex(h => h.date === log.created_at)
                        const previousWorkout = currentIndex > 0
                            ? { weight: allHistory[currentIndex - 1].weight, date: allHistory[currentIndex - 1].date }
                            : null

                        exercises.push({
                            name: loggedEx.exercise,
                            currentWeight: loggedEx.weight,
                            history,
                            isPR,
                            previousWorkout
                        })
                    }
                })
            }

            // Check if total volume is a PR for this workout type
            const volumeKey = log.workout_type
            const currentMaxVolume = maxVolumeMap[volumeKey] || 0
            const volumeIsPR = total_volume > currentMaxVolume && currentMaxVolume > 0
            if (total_volume > currentMaxVolume) {
                maxVolumeMap[volumeKey] = total_volume
            }

            return {
                id: log.id,
                date: log.created_at,
                day_name: log.workout_type,
                total_volume,
                weekNumber,
                isDeload,
                improvement: null,
                isPR: sessionIsPR || volumeIsPR,
                exercises,
                rawExercises: log.exercises_data || []
            }
        })

        // Calculate improvement compared to previous session of SAME workout type
        processed.forEach((session, idx) => {
            const prevSameType = processed
                .slice(0, idx)
                .reverse()
                .find(s => s.day_name === session.day_name)

            if (prevSameType && prevSameType.total_volume > 0) {
                session.improvement = ((session.total_volume - prevSameType.total_volume) / prevSameType.total_volume) * 100
            }
        })

        setSessions(processed)
    }

    const toggleExpand = (sessionId: string) => {
        setExpandedSession(expandedSession === sessionId ? null : sessionId)
    }

    // Find previous workout of same type for comparison
    const findPreviousWorkout = (session: ProcessedSession, allSessions: ProcessedSession[]) => {
        const sessionIndex = allSessions.findIndex(s => s.id === session.id)
        for (let i = sessionIndex + 1; i < allSessions.length; i++) {
            if (allSessions[i].day_name === session.day_name) {
                return allSessions[i]
            }
        }
        return null
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
                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {currentSession.total_volume.toLocaleString()} kg
                            {currentSession.isPR && <Trophy className="h-5 w-5 text-amber-500" />}
                        </div>
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

            {/* Progress Table with Expandable Rows */}
            <div className="rounded-lg border bg-white shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                            <tr>
                                <th className="px-4 py-3 w-8"></th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Workout</th>
                                <th className="px-4 py-3 text-center">Week #</th>
                                <th className="px-4 py-3 text-right">Volume</th>
                                <th className="px-4 py-3 text-right">Improvement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tableSessions.map((session) => {
                                const prevWorkout = findPreviousWorkout(session, tableSessions)
                                const isExpanded = expandedSession === session.id

                                return (
                                    <>
                                        <tr
                                            key={session.id}
                                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${session.isDeload ? 'bg-amber-50/30' : ''}`}
                                            onClick={() => toggleExpand(session.id)}
                                        >
                                            <td className="px-4 py-3">
                                                {isExpanded ? (
                                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {new Date(session.date).toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 flex items-center gap-2">
                                                {session.day_name}
                                                {session.isPR && <Trophy className="h-4 w-4 text-amber-500" />}
                                            </td>
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

                                        {/* Expanded Exercise Details */}
                                        {isExpanded && (
                                            <tr key={`${session.id}-expanded`}>
                                                <td colSpan={6} className="px-4 py-4 bg-slate-50/50">
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-slate-700 text-sm mb-3">Exercise Breakdown</h4>
                                                        <div className="grid gap-3">
                                                            {session.exercises.map((exercise, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 shadow-sm"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-slate-800">{exercise.name}</span>
                                                                                {exercise.isPR && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                                                                        <Trophy className="h-3 w-3" /> PR
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-4 mt-1 text-sm">
                                                                                <span className="text-slate-900 font-semibold">
                                                                                    {exercise.currentWeight} kg
                                                                                </span>
                                                                                {exercise.previousWorkout && (
                                                                                    <span className="text-slate-500">
                                                                                        Previous: {exercise.previousWorkout.weight} kg
                                                                                        {exercise.currentWeight > exercise.previousWorkout.weight && (
                                                                                            <span className="text-green-600 mr-1">
                                                                                                (+{(exercise.currentWeight - exercise.previousWorkout.weight).toFixed(1)})
                                                                                            </span>
                                                                                        )}
                                                                                        {exercise.currentWeight < exercise.previousWorkout.weight && (
                                                                                            <span className="text-red-500 mr-1">
                                                                                                ({(exercise.currentWeight - exercise.previousWorkout.weight).toFixed(1)})
                                                                                            </span>
                                                                                        )}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Mini Sparkline */}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-slate-400">Trend</span>
                                                                        <MiniSparkline data={exercise.history.map(h => h.weight)} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Previous Workout Comparison */}
                                                        {prevWorkout && (
                                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                <h5 className="font-semibold text-blue-800 text-sm mb-2">
                                                                    Compared to Previous {session.day_name} ({new Date(prevWorkout.date).toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit' })})
                                                                </h5>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-blue-600">This Workout:</span>
                                                                        <span className="font-bold text-blue-900 mr-2">{session.total_volume.toLocaleString()} kg</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-blue-600">Previous:</span>
                                                                        <span className="font-bold text-blue-900 mr-2">{prevWorkout.total_volume.toLocaleString()} kg</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
