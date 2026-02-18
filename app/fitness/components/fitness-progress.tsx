"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components"
import { Loader2, TrendingUp, AlertCircle, Dumbbell, CalendarCheck, ChevronDown, ChevronUp, Trophy, Flame } from "lucide-react"
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
    day_name_he: string
    icon: string
    total_volume: number
    weekNumber: number
    isDeload: boolean
    improvement: number | null
    isPR: boolean
    exercises: ExerciseData[]
    rawExercises: { exercise: string; weight: number; completed: boolean }[]
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
            const program = WORKOUT_PROGRAMS[log.workout_type]
            if (!program) return // Skip if workout type not found in new programs

            log.exercises_data?.forEach(ex => {
                const key = `${log.workout_type}-${ex.exercise.toLowerCase().trim()}`
                if (!exerciseHistoryMap[key]) {
                    exerciseHistoryMap[key] = []
                }
                const def = program.exercises.find(e =>
                    e.name.trim().toLowerCase() === ex.exercise.trim().toLowerCase() ||
                    e.nameHe.trim() === ex.exercise.trim()
                )
                const sets = def?.sets || 3
                const volume = ex.weight * sets * 10 // Assuming average 10 reps

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
            const program = WORKOUT_PROGRAMS[log.workout_type]
            if (!program) {
                // Handle legacy workout types
                return {
                    id: log.id,
                    date: log.created_at,
                    day_name: log.workout_type,
                    day_name_he: log.workout_type,
                    icon: '🏋️',
                    total_volume: 0,
                    weekNumber: Math.floor(index / 5) + 1,
                    isDeload: false,
                    improvement: null,
                    isPR: false,
                    exercises: [],
                    rawExercises: log.exercises_data || []
                }
            }

            const weekNumber = Math.floor(index / 5) + 1 // 5 training days per week
            const isDeload = weekNumber % 8 === 0

            let total_volume = 0
            let sessionIsPR = false
            const exercises: ExerciseData[] = []

            if (log.exercises_data) {
                log.exercises_data.forEach(loggedEx => {
                    const key = `${log.workout_type}-${loggedEx.exercise.toLowerCase().trim()}`
                    const def = program.exercises.find(e =>
                        e.name.trim().toLowerCase() === loggedEx.exercise.trim().toLowerCase() ||
                        e.nameHe.trim() === loggedEx.exercise.trim()
                    )

                    if (loggedEx.weight > 0) {
                        const sets = def?.sets || 3
                        const reps = 10 // Average reps
                        const exerciseVolume = sets * reps * loggedEx.weight
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
                day_name_he: program.nameHe,
                icon: program.icon,
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
            <h3 className="text-lg font-semibold text-slate-700">אין אימונים עדיין</h3>
            <p className="text-slate-500">
                עבור למודול <span className="font-bold text-orange-500">Body</span> כדי להתחיל את האימון הראשון!
            </p>
        </div>
    )

    const currentSession = sessions[sessions.length - 1]
    const currentWeek = currentSession.weekNumber
    const isDeloadWeek = currentWeek % 8 === 0
    const weeksUntilDeload = 8 - (currentWeek % 8)

    // Reverse for table display (Newest first)
    const tableSessions = [...sessions].reverse()

    // Count workout types for stats
    const workoutTypeCounts: Record<string, number> = {}
    sessions.forEach(s => {
        workoutTypeCounts[s.day_name] = (workoutTypeCounts[s.day_name] || 0) + 1
    })

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Cards - Stack on mobile, 3 cols on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <Card className="bg-white shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-slate-600">שלב נוכחי</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="text-xl md:text-2xl font-bold text-slate-900">שבוע {currentWeek}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {isDeloadWeek ? (
                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> שבוע DELOAD
                                </span>
                            ) : (
                                <span>{weeksUntilDeload === 8 ? 0 : weeksUntilDeload} שבועות עד Deload</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-slate-600">נפח אחרון</CardTitle>
                        <Dumbbell className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {currentSession.total_volume.toLocaleString()} kg
                            {currentSession.isPR && <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />}
                        </div>
                        <p className={`text-xs mt-1 flex items-center gap-1 ${currentSession.improvement && currentSession.improvement > 0 ? 'text-green-600' : 'text-slate-500'
                            }`}>
                            {currentSession.improvement ? (
                                <>
                                    <TrendingUp className={`h-3 w-3 ${currentSession.improvement < 0 ? 'rotate-180 text-red-500' : ''}`} />
                                    {Math.abs(currentSession.improvement).toFixed(1)}%
                                </>
                            ) : "אימון ראשון"}
                        </p>
                    </CardContent>
                </Card>

                <Card className={`${isDeloadWeek ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} shadow sm:col-span-2 md:col-span-1`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
                        <CardTitle className={`text-xs md:text-sm font-medium ${isDeloadWeek ? 'text-amber-700' : 'text-blue-700'}`}>
                            {isDeloadWeek ? "עצת Deload" : "מיקוד אימון"}
                        </CardTitle>
                        <Flame className={`h-4 w-4 ${isDeloadWeek ? 'text-amber-600' : 'text-blue-600'}`} />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                        <div className={`text-xs md:text-sm font-semibold ${isDeloadWeek ? 'text-amber-900' : 'text-blue-900'}`}>
                            {isDeloadWeek
                                ? "הורד עומס ב-50%"
                                : "עלייה הדרגתית במשקלים"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Volume Chart - Smaller on mobile */}
            <Card className="bg-white shadow border-slate-200 p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-bold text-slate-900">התקדמות נפח</h3>
                    <p className="text-xs md:text-sm text-slate-500">סה״כ נפח לאימון</p>
                </div>
                <div className="h-[200px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sessions}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
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
                                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                width={35}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                formatter={(value: number) => [`${value.toLocaleString()} kg`, 'נפח']}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('he-IL', { dateStyle: 'medium' })}
                            />
                            <Line
                                type="monotone"
                                dataKey="total_volume"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ fill: '#2563eb', strokeWidth: 1, r: 3, stroke: '#fff' }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Mobile: Card-based layout, Desktop: Table */}
            <div className="space-y-3">
                <h3 className="text-base md:text-lg font-bold text-slate-900 px-1">היסטוריית אימונים</h3>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {tableSessions.map((session) => {
                        const prevWorkout = findPreviousWorkout(session, tableSessions)
                        const isExpanded = expandedSession === session.id

                        return (
                            <div
                                key={session.id}
                                className={`rounded-xl border bg-white shadow-sm overflow-hidden ${session.isDeload ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}
                            >
                                {/* Card Header - Clickable */}
                                <div
                                    className="p-4 cursor-pointer active:bg-slate-50"
                                    onClick={() => toggleExpand(session.id)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{session.icon}</span>
                                            <span className="font-bold text-slate-900">{session.day_name_he}</span>
                                            {session.isPR && <Trophy className="h-4 w-4 text-amber-500" />}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${session.isDeload ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                ש{session.weekNumber}
                                            </span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-500">
                                            {new Date(session.date).toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-semibold text-slate-700">
                                                {session.total_volume.toLocaleString()} kg
                                            </span>
                                            {session.improvement && (
                                                <span className={`text-sm font-bold ${session.improvement > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {session.improvement > 0 ? '+' : ''}{session.improvement.toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                                        <h4 className="font-semibold text-slate-700 text-sm">תרגילים</h4>
                                        <div className="space-y-2">
                                            {session.exercises.map((exercise, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-white rounded-lg p-3 border border-slate-200"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-slate-800 text-sm truncate">{exercise.name}</span>
                                                                {exercise.isPR && (
                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold shrink-0">
                                                                        <Trophy className="h-3 w-3" /> PR
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-sm">
                                                                <span className="text-slate-900 font-semibold">
                                                                    {exercise.currentWeight} kg
                                                                </span>
                                                                {exercise.previousWorkout && (
                                                                    <span className={`text-xs ${
                                                                        exercise.currentWeight > exercise.previousWorkout.weight ? 'text-green-600' :
                                                                        exercise.currentWeight < exercise.previousWorkout.weight ? 'text-red-500' : 'text-slate-400'
                                                                    }`}>
                                                                        {exercise.currentWeight > exercise.previousWorkout.weight && '+'}
                                                                        {exercise.currentWeight !== exercise.previousWorkout.weight &&
                                                                            (exercise.currentWeight - exercise.previousWorkout.weight).toFixed(1)
                                                                        }
                                                                        {exercise.currentWeight !== exercise.previousWorkout.weight && ' kg'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <MiniSparkline data={exercise.history.map(h => h.weight)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Previous Workout Comparison */}
                                        {prevWorkout && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <h5 className="font-semibold text-blue-800 text-xs mb-2">
                                                    לעומת {session.day_name_he} הקודם
                                                </h5>
                                                <div className="flex justify-between text-sm">
                                                    <div>
                                                        <span className="text-blue-600 text-xs">עכשיו: </span>
                                                        <span className="font-bold text-blue-900">{session.total_volume.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-600 text-xs">אז: </span>
                                                        <span className="font-bold text-blue-900">{prevWorkout.total_volume.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                    <th className="px-4 py-3">תאריך</th>
                                    <th className="px-4 py-3">אימון</th>
                                    <th className="px-4 py-3 text-center">שבוע</th>
                                    <th className="px-4 py-3 text-left">נפח</th>
                                    <th className="px-4 py-3 text-left">שיפור</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tableSessions.map((session) => {
                                    const prevWorkout = findPreviousWorkout(session, tableSessions)
                                    const isExpanded = expandedSession === session.id

                                    return (
                                        <React.Fragment key={session.id}>
                                            <tr
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
                                                <td className="px-4 py-3 text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <span>{session.icon}</span>
                                                        <span>{session.day_name_he}</span>
                                                        {session.isPR && <Trophy className="h-4 w-4 text-amber-500" />}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${session.isDeload ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        ש{session.weekNumber}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-left font-mono font-medium text-slate-700">
                                                    {session.total_volume.toLocaleString()}
                                                </td>
                                                <td className={`px-4 py-3 text-left font-bold ${!session.improvement ? 'text-slate-400' :
                                                    session.improvement > 0 ? 'text-green-600' : 'text-red-500'
                                                    }`}>
                                                    {session.improvement ? `${session.improvement > 0 ? '+' : ''}${session.improvement.toFixed(1)}%` : '-'}
                                                </td>
                                            </tr>

                                            {/* Expanded Exercise Details */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-4 bg-slate-50/50">
                                                        <div className="space-y-3">
                                                            <h4 className="font-semibold text-slate-700 text-sm mb-3">פירוט תרגילים</h4>
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
                                                                                            קודם: {exercise.previousWorkout.weight} kg
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
                                                                            <span className="text-xs text-slate-400">מגמה</span>
                                                                            <MiniSparkline data={exercise.history.map(h => h.weight)} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Previous Workout Comparison */}
                                                            {prevWorkout && (
                                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                    <h5 className="font-semibold text-blue-800 text-sm mb-2">
                                                                        לעומת {session.day_name_he} הקודם ({new Date(prevWorkout.date).toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit' })})
                                                                    </h5>
                                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                                        <div>
                                                                            <span className="text-blue-600">אימון זה:</span>
                                                                            <span className="font-bold text-blue-900 mr-2">{session.total_volume.toLocaleString()} kg</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-blue-600">קודם:</span>
                                                                            <span className="font-bold text-blue-900 mr-2">{prevWorkout.total_volume.toLocaleString()} kg</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
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
