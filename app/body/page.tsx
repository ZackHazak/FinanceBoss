"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components"
import { Dumbbell, Save, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Workout {
    id: string
    created_at: string
    name: string
    sets: number
    reps: number
    weight: number
}

export default function BodyPage() {
    const [workouts, setWorkouts] = useState<Workout[]>([])
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [sets, setSets] = useState("")
    const [reps, setReps] = useState("")
    const [weight, setWeight] = useState("")

    useEffect(() => {
        fetchWorkouts()
    }, [])

    const fetchWorkouts = async () => {
        const { data } = await supabase
            .from('workouts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) setWorkouts(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.from('workouts').insert({
            name,
            sets: parseInt(sets) || 0,
            reps: parseInt(reps) || 0,
            weight: parseFloat(weight) || 0
        })

        if (!error) {
            setName("")
            setSets("")
            setReps("")
            setWeight("")
            fetchWorkouts()
        } else {
            alert("שגיאה בשמירה")
        }
        setLoading(false)
    }

    return (
        <div className="mx-auto max-w-lg p-6 space-y-8 pb-24">
            <div className="flex items-center gap-4">
                <Link href="/" className="rounded-full bg-secondary p-2 hover:bg-secondary/80">
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-red-500" />
                    אימונים
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">תיעוד סט חדש</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                placeholder="שם התרגיל (למשל: בנץ' פרס)"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                type="number"
                                placeholder="סטים"
                                value={sets}
                                onChange={e => setSets(e.target.value)}
                            />
                            <Input
                                type="number"
                                placeholder="חזרות"
                                value={reps}
                                onChange={e => setReps(e.target.value)}
                            />
                            <Input
                                type="number"
                                placeholder="משקל (ק״ג)"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                            {loading ? "שומר..." : "שמור סט"}
                            <Save className="mr-2 h-4 w-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="font-semibold text-lg">היסטוריה אחרונה</h2>
                {workouts.map(w => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
                        <div>
                            <p className="font-medium">{w.name}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                <span>{new Date(w.created_at).toLocaleDateString("he-IL")}</span>
                                <span>•</span>
                                <span>{new Date(w.created_at).toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                        <div className="text-right text-sm">
                            <div className="font-bold">{w.weight} ק״ג</div>
                            <div className="text-muted-foreground">{w.sets} x {w.reps}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
