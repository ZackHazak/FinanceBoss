"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui-components"
import { Dumbbell, ArrowRight, Calendar, CheckCircle2, Trash2, TrendingUp, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { WORKOUT_CYCLE, WORKOUT_PROGRAMS, type WorkoutType } from "./workout-data"




interface WorkoutLog {
    id: string
    created_at: string
    workout_type: WorkoutType
    exercises_data: {
        exercise: string
        weight: number
        reps: number
        completed: boolean
    }[]
}

interface ExerciseInput {
    exercise: string
    weight: string
    reps: number
    completed: boolean
}

export default function BodyPage() {
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
    const [loading, setLoading] = useState(false)
    const [currentWorkout, setCurrentWorkout] = useState<WorkoutType>("PULL")
    const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>([])
    const [sessionStarted, setSessionStarted] = useState(false)

    useEffect(() => {
        fetchWorkoutLogs()
    }, [])

    const fetchWorkoutLogs = async () => {
        const { data } = await supabase
            .from('ppl_workouts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) {
            setWorkoutLogs(data)
            determineNextWorkout(data)
        }
    }

    const determineNextWorkout = (logs: WorkoutLog[]) => {
        if (logs.length === 0) {
            setCurrentWorkout("PULL")
            return
        }

        const lastWorkout = logs[0].workout_type
        const lastIndex = WORKOUT_CYCLE.indexOf(lastWorkout)
        const nextIndex = (lastIndex + 1) % WORKOUT_CYCLE.length
        setCurrentWorkout(WORKOUT_CYCLE[nextIndex])
    }

    const startSession = () => {
        const program = WORKOUT_PROGRAMS[currentWorkout]
        const inputs = program.exercises.map(ex => ({
            exercise: ex.name,
            weight: "",
            reps: 0,
            completed: false
        }))
        setExerciseInputs(inputs)
        setSessionStarted(true)
    }

    const updateWeight = (index: number, weight: string) => {
        const updated = [...exerciseInputs]
        updated[index].weight = weight
        setExerciseInputs(updated)
    }

    const updateReps = (index: number, reps: number) => {
        const updated = [...exerciseInputs]
        updated[index].reps = Math.max(0, reps)
        setExerciseInputs(updated)
    }

    const incrementReps = (index: number) => {
        const updated = [...exerciseInputs]
        updated[index].reps = updated[index].reps + 1
        setExerciseInputs(updated)
    }

    const decrementReps = (index: number) => {
        const updated = [...exerciseInputs]
        updated[index].reps = Math.max(0, updated[index].reps - 1)
        setExerciseInputs(updated)
    }

    const toggleCompleted = (index: number) => {
        const updated = [...exerciseInputs]
        updated[index].completed = !updated[index].completed
        setExerciseInputs(updated)
    }

    const finishWorkout = async () => {
        setLoading(true)

        const exercisesData = exerciseInputs.map(input => ({
            exercise: input.exercise,
            weight: parseFloat(input.weight) || 0,
            reps: input.reps || 0,
            completed: input.completed
        }))

        const { error } = await supabase.from('ppl_workouts').insert({
            workout_type: currentWorkout,
            exercises_data: exercisesData
        })

        if (!error) {
            setSessionStarted(false)
            setExerciseInputs([])
            fetchWorkoutLogs()
        } else {
            alert("שגיאה בשמירה")
        }

        setLoading(false)
    }

    const deleteWorkout = async (workoutId: string) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק אימון זה?")) {
            return
        }

        const { error } = await supabase
            .from('ppl_workouts')
            .delete()
            .eq('id', workoutId)

        if (!error) {
            fetchWorkoutLogs()
        } else {
            alert("שגיאה במחיקה")
        }
    }

    const program = WORKOUT_PROGRAMS[currentWorkout]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="mx-auto max-w-5xl px-4 py-4 md:p-6 space-y-4 md:space-y-8 pb-24">
                {/* Header - Responsive */}
                <div className="flex items-center gap-3 md:gap-4 pt-2 md:pt-4">
                    <Link href="/" className="group rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-sm p-2.5 md:p-3 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/50">
                        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
                    </Link>
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 p-2 md:p-2.5 shadow-lg shadow-orange-500/30">
                            <Dumbbell className="h-5 w-5 md:h-7 md:w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                                Workout Logger
                            </h1>
                            <p className="text-xs md:text-sm text-slate-500 mt-0.5 flex items-center gap-1 md:gap-2">
                                <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                PPL Training System
                            </p>
                        </div>
                    </div>
                </div>

                {/* Next Workout Card - Responsive */}
                {!sessionStarted && (
                    <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl border-2 ${program.borderGlow} bg-white/80 backdrop-blur-xl shadow-xl md:shadow-2xl shadow-slate-900/10 transition-all duration-500`}>
                        {/* Gradient Background Glow */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${program.gradient} opacity-5`}></div>

                        <div className="relative p-4 md:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-6">
                                    <div className={`rounded-2xl md:rounded-3xl bg-gradient-to-br ${program.gradient} p-3 md:p-5 shadow-xl`}>
                                        <Dumbbell className="h-6 w-6 md:h-10 md:w-10 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                            <h2 className={`text-2xl md:text-4xl font-bold bg-gradient-to-br ${program.gradient} bg-clip-text text-transparent`}>
                                                {program.name}
                                            </h2>
                                            <span className={`px-2 md:px-4 py-1 md:py-1.5 rounded-full ${program.bgGlow} border ${program.borderGlow} text-xs md:text-sm font-semibold`}>
                                                Workout
                                            </span>
                                        </div>
                                        <p className="text-slate-500 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                                            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            האימון הבא שלך מחכה
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {program.exercises.length} תרגילים • {String(program.exercises.reduce((acc: number, ex) => acc + ex.sets, 0))} סטים
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={startSession}
                                    className={`w-full sm:w-auto bg-gradient-to-br ${program.gradient} hover:opacity-90 text-white text-base md:text-xl font-semibold px-6 md:px-10 py-4 md:py-7 rounded-xl md:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 md:hover:scale-105`}
                                >
                                    התחל אימון
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Workout Session - Mobile Cards / Desktop Table */}
                {sessionStarted && (
                    <div className="rounded-2xl md:rounded-3xl border-2 border-slate-200/50 bg-white/90 backdrop-blur-xl shadow-xl md:shadow-2xl shadow-slate-900/10 overflow-hidden">
                        {/* Header */}
                        <div className={`relative bg-gradient-to-br ${program.gradient} p-4 md:p-8`}>
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">{program.name}</h2>
                                    <p className="text-white/80 text-xs md:text-base">
                                        {new Date().toLocaleDateString("he-IL", { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl md:text-6xl font-bold text-white/90">
                                        {exerciseInputs.filter(e => e.completed).length}
                                    </div>
                                    <div className="text-white/70 text-xs md:text-sm">מתוך {program.exercises.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Card Layout */}
                        <div className="md:hidden p-3 space-y-3">
                            {program.exercises.map((exercise, index) => (
                                <div
                                    key={index}
                                    className={`rounded-xl border-2 p-4 transition-all duration-200 ${exerciseInputs[index]?.completed
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className={`font-semibold text-sm ${exerciseInputs[index]?.completed ? 'text-green-700' : 'text-slate-800'}`}>
                                                {exercise.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                                                    {exercise.sets} סטים
                                                </span>
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                                                    {exercise.reps} חזרות
                                                </span>
                                                <span className="px-2 py-0.5 rounded bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold">
                                                    RPE {exercise.rpe}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleCompleted(index)}
                                            className="p-1"
                                        >
                                            <CheckCircle2
                                                className={`h-7 w-7 transition-all duration-200 ${exerciseInputs[index]?.completed
                                                    ? "text-green-600 fill-green-600"
                                                    : "text-slate-300"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs text-slate-500">משקל:</span>
                                        <input
                                            type="number"
                                            step="0.5"
                                            placeholder="0.0"
                                            value={exerciseInputs[index]?.weight || ""}
                                            onChange={(e) => updateWeight(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg text-center font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
                                        />
                                        <span className="text-xs text-slate-500">ק״ג</span>
                                    </div>
                                    {/* Rep Counter */}
                                    <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                                        <span className="text-xs font-medium text-slate-600">חזרות שבוצעו:</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => decrementReps(index)}
                                                className="w-9 h-9 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="w-12 text-center text-xl font-bold text-slate-800">
                                                {exerciseInputs[index]?.reps || 0}
                                            </span>
                                            <button
                                                onClick={() => incrementReps(index)}
                                                className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shadow-md"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block p-1">
                            <div className="overflow-hidden rounded-2xl">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-l from-slate-50 to-slate-100 border-b-2 border-slate-200">
                                            <th className="text-right px-8 py-5 text-sm font-bold text-slate-700 uppercase tracking-wider">תרגיל</th>
                                            <th className="text-center px-4 py-5 text-sm font-bold text-slate-700 uppercase tracking-wider">סטים</th>
                                            <th className="text-center px-4 py-5 text-sm font-bold text-slate-700 uppercase tracking-wider">יעד</th>
                                            <th className="text-center px-4 py-5 text-sm font-bold text-slate-700 uppercase tracking-wider">RPE</th>
                                            <th className="text-center px-8 py-5 text-sm font-bold text-slate-700 uppercase tracking-wider">משקל (ק״ג)</th>
                                            <th className="text-center px-6 py-5 text-sm font-bold text-slate-700 uppercase tracking-wider">חזרות</th>
                                            <th className="text-center px-6 py-5 text-sm font-bold text-slate-700 uppercase tracking-wider">סטטוס</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {program.exercises.map((exercise, index) => (
                                            <tr
                                                key={index}
                                                className={`border-b border-slate-100 transition-all duration-200 ${exerciseInputs[index]?.completed
                                                    ? 'bg-green-50/50'
                                                    : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                <td className="text-right px-8 py-5">
                                                    <span className={`font-semibold text-base ${exerciseInputs[index]?.completed ? 'text-green-700' : 'text-slate-800'}`}>
                                                        {exercise.name}
                                                    </span>
                                                </td>
                                                <td className="text-center px-4 py-5">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm">
                                                        {exercise.sets}
                                                    </span>
                                                </td>
                                                <td className="text-center px-4 py-5">
                                                    <span className="inline-flex items-center justify-center min-w-[2rem] px-3 h-8 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm">
                                                        {exercise.reps}
                                                    </span>
                                                </td>
                                                <td className="text-center px-4 py-5">
                                                    <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-white font-bold text-sm shadow-md">
                                                        {exercise.rpe}
                                                    </span>
                                                </td>
                                                <td className="text-center px-8 py-5">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        placeholder="0.0"
                                                        value={exerciseInputs[index]?.weight || ""}
                                                        onChange={(e) => updateWeight(index, e.target.value)}
                                                        className="w-24 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-center font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-300"
                                                    />
                                                </td>
                                                <td className="text-center px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => decrementReps(index)}
                                                            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-10 text-center text-lg font-bold text-slate-800">
                                                            {exerciseInputs[index]?.reps || 0}
                                                        </span>
                                                        <button
                                                            onClick={() => incrementReps(index)}
                                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shadow-md"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="text-center px-6 py-5">
                                                    <button
                                                        onClick={() => toggleCompleted(index)}
                                                        className="group hover:scale-110 transition-transform duration-200"
                                                    >
                                                        <CheckCircle2
                                                            className={`h-8 w-8 transition-all duration-200 ${exerciseInputs[index]?.completed
                                                                ? "text-green-600 fill-green-600 drop-shadow-lg"
                                                                : "text-slate-300 group-hover:text-slate-400"
                                                                }`}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Buttons - Responsive */}
                        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-white border-t border-slate-200 flex flex-col sm:flex-row gap-3 md:gap-4">
                            <Button
                                onClick={finishWorkout}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base md:text-lg font-semibold py-4 md:py-7 rounded-xl md:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 md:hover:scale-[1.02] disabled:opacity-50"
                            >
                                {loading ? "שומר..." : "סיים אימון ושמור"}
                            </Button>
                            <Button
                                onClick={() => setSessionStarted(false)}
                                variant="outline"
                                className="sm:w-auto px-6 md:px-10 text-base md:text-lg font-semibold py-4 md:py-7 rounded-xl md:rounded-2xl border-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300"
                            >
                                ביטול
                            </Button>
                        </div>
                    </div>
                )}

                {/* Workout History - Responsive */}
                <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between px-1 md:px-2">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800">היסטוריית אימונים</h2>
                        <div className="flex items-center gap-2 md:gap-3">
                            <span className="text-xs md:text-sm text-slate-500">{workoutLogs.length} אימונים</span>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                    </div>

                    {workoutLogs.length === 0 ? (
                        <div className="rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm p-8 md:p-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-4 md:mb-6">
                                <Dumbbell className="h-8 w-8 md:h-10 md:w-10 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-semibold text-base md:text-lg mb-2">עדיין לא השלמת אימונים</p>
                            <p className="text-slate-400 text-sm md:text-base">התחל את האימון הראשון שלך!</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:gap-4">
                            {workoutLogs.map(log => {
                                const logProgram = WORKOUT_PROGRAMS[log.workout_type]
                                const completionRate = log.exercises_data.filter(e => e.completed).length / log.exercises_data.length

                                return (
                                    <div
                                        key={log.id}
                                        className="group relative overflow-hidden rounded-2xl md:rounded-3xl border-2 border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-md md:shadow-lg hover:shadow-xl md:hover:shadow-2xl transition-all duration-300"
                                    >
                                        {/* Gradient Accent */}
                                        <div className={`absolute top-0 left-0 right-0 h-1 md:h-1.5 bg-gradient-to-r ${logProgram.gradient}`}></div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => deleteWorkout(log.id)}
                                            className="absolute top-3 left-3 md:top-4 md:left-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg md:shadow-xl z-10"
                                            title="מחק אימון"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        </button>

                                        <div className="p-4 md:p-6">
                                            <div className="flex items-start justify-between mb-3 md:mb-4">
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className={`rounded-xl md:rounded-2xl bg-gradient-to-br ${logProgram.gradient} p-2.5 md:p-4 shadow-lg`}>
                                                        <Dumbbell className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className={`text-xl md:text-2xl font-bold bg-gradient-to-br ${logProgram.gradient} bg-clip-text text-transparent mb-0.5 md:mb-1`}>
                                                            {log.workout_type}
                                                        </h3>
                                                        <p className="text-xs md:text-sm text-slate-500">
                                                            {new Date(log.created_at).toLocaleDateString("he-IL", {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                        {log.exercises_data.filter(e => e.completed).length}
                                                    </div>
                                                    <div className="text-[10px] md:text-xs text-slate-500 font-medium">
                                                        מתוך {log.exercises_data.length}
                                                    </div>
                                                    {/* Progress Bar */}
                                                    <div className="mt-1.5 md:mt-2 w-14 md:w-20 h-1 md:h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                                                            style={{ width: `${completionRate * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Exercise Grid - Responsive */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                                {log.exercises_data.map((ex, i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl border transition-all duration-200 ${ex.completed
                                                            ? 'bg-green-50/50 border-green-200/50'
                                                            : 'bg-slate-50/50 border-slate-200/50'
                                                            }`}
                                                    >
                                                        <CheckCircle2
                                                            className={`h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 ${ex.completed ? "text-green-600 fill-green-600" : "text-slate-300"
                                                                }`}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-xs font-semibold truncate ${ex.completed ? "text-green-900" : "text-slate-600"
                                                                }`}>
                                                                {ex.exercise}
                                                            </div>
                                                            <div className={`text-xs font-bold flex items-center gap-2 ${ex.completed ? "text-green-700" : "text-slate-400"
                                                                }`}>
                                                                <span>{ex.weight} ק״ג</span>
                                                                {ex.reps > 0 && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px]">
                                                                        {ex.reps} חזרות
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
