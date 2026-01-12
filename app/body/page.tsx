"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components"
import { Dumbbell, Plus, ArrowRight, Flame } from "lucide-react"
import Link from "next/link"

interface Workout {
    id: string
    created_at: string
    workout_type: string
    duration: number
    intensity: number
    notes: string
}

export default function BodyPage() {
    const [workouts, setWorkouts] = useState<Workout[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)

    // Form fields
    const [workoutType, setWorkoutType] = useState("")
    const [duration, setDuration] = useState("")
    const [intensity, setIntensity] = useState("5")
    const [notes, setNotes] = useState("")

    useEffect(() => {
        fetchWorkouts()
    }, [])

    const fetchWorkouts = async () => {
        const { data } = await supabase
            .from('workouts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30)

        if (data) setWorkouts(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.from('workouts').insert({
            workout_type: workoutType,
            duration: parseInt(duration) || 0,
            intensity: parseInt(intensity) || 5,
            notes: notes
        })

        if (!error) {
            setWorkoutType("")
            setDuration("")
            setIntensity("5")
            setNotes("")
            setShowForm(false)
            fetchWorkouts()
        } else {
            alert("שגיאה בשמירה")
        }
        setLoading(false)
    }

    const getWorkoutTypeColor = (type: string) => {
        const lower = type.toLowerCase()
        if (lower.includes("strength") || lower.includes("כוח")) return "text-orange-600 bg-orange-50"
        if (lower.includes("cardio") || lower.includes("אירובי")) return "text-blue-600 bg-blue-50"
        if (lower.includes("flexibility") || lower.includes("גמישות")) return "text-green-600 bg-green-50"
        return "text-purple-600 bg-purple-50"
    }

    const getIntensityColor = (intensity: number) => {
        if (intensity >= 8) return "text-red-600"
        if (intensity >= 5) return "text-orange-600"
        return "text-green-600"
    }

    return (
        <div className="mx-auto max-w-2xl p-6 space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="rounded-full bg-secondary p-2 hover:bg-secondary/80 transition-colors">
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Dumbbell className="h-8 w-8 text-red-500" />
                            Body
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">מעקב אימונים וכושר</p>
                    </div>
                </div>
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full h-12 w-12 p-0 shadow-lg"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                )}
            </div>

            {/* Add Workout Form */}
            {showForm && (
                <Card className="border-red-200 shadow-lg">
                    <CardHeader className="bg-red-50/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-5 w-5 text-red-600" />
                            אימון חדש
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    סוג אימון
                                </label>
                                <select
                                    value={workoutType}
                                    onChange={e => setWorkoutType(e.target.value)}
                                    required
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="">בחר סוג אימון</option>
                                    <option value="Strength">Strength - אימון כוח</option>
                                    <option value="Cardio">Cardio - אימון אירובי</option>
                                    <option value="Flexibility">Flexibility - גמישות</option>
                                    <option value="HIIT">HIIT - אימון אינטרוולים</option>
                                    <option value="Yoga">Yoga - יוגה</option>
                                    <option value="Swimming">Swimming - שחייה</option>
                                    <option value="Running">Running - ריצה</option>
                                    <option value="Other">אחר</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    משך (דקות)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="למשל: 45"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    required
                                    min="1"
                                    className="text-base"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    עצימות (1-10): <span className="font-bold text-foreground">{intensity}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={intensity}
                                    onChange={e => setIntensity(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>קל</span>
                                    <span>בינוני</span>
                                    <span>קשה</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    הערות (אופציונלי)
                                </label>
                                <textarea
                                    placeholder="הערות על האימון, תחושות, הישגים..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? "שומר..." : "שמור אימון"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                    className="px-6"
                                >
                                    ביטול
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Workout History */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl">היסטוריית אימונים</h2>
                    <span className="text-sm text-muted-foreground">{workouts.length} אימונים</span>
                </div>

                {workouts.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">עדיין לא רשמת אימונים</p>
                            <p className="text-sm text-muted-foreground mt-1">לחץ על כפתור + כדי להתחיל</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {workouts.map(w => (
                            <Card key={w.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkoutTypeColor(w.workout_type)}`}>
                                                    {w.workout_type}
                                                </span>
                                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                    {w.duration} דקות
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                                <span>{new Date(w.created_at).toLocaleDateString("he-IL", {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}</span>
                                                <span>•</span>
                                                <span>{new Date(w.created_at).toLocaleTimeString("he-IL", {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</span>
                                            </div>

                                            {w.notes && (
                                                <p className="text-sm text-muted-foreground mt-2 italic">
                                                    {w.notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1">
                                                <Flame className={`h-4 w-4 ${getIntensityColor(w.intensity)}`} />
                                                <span className={`font-bold text-lg ${getIntensityColor(w.intensity)}`}>
                                                    {w.intensity}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">עצימות</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
