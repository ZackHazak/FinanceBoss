"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Input, Button } from "@/components/ui-components"
import { CheckSquare, Plus, ArrowRight, Trash2 } from "lucide-react"
import Link from "next/link"

interface Task {
    id: string
    content: string
    is_completed: boolean
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [newTask, setNewTask] = useState("")

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .order('is_completed', { ascending: true })
            .order('created_at', { ascending: false })

        if (data) setTasks(data)
    }

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return

        const { data, error } = await supabase
            .from('tasks')
            .insert({ content: newTask })
            .select()
            .single()

        if (!error && data) {
            setTasks(prev => [data, ...prev])
            setNewTask("")
        }
    }

    const toggleTask = async (task: Task) => {
        // Optimistic update
        const updatedStatus = !task.is_completed
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: updatedStatus } : t))

        await supabase
            .from('tasks')
            .update({ is_completed: updatedStatus })
            .eq('id', task.id)

        fetchTasks() // Refresh to sort correctly
    }

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id))
        await supabase.from('tasks').delete().eq('id', id)
    }

    return (
        <div className="mx-auto max-w-lg p-6 space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link href="/" className="rounded-full bg-secondary p-2 hover:bg-secondary/80">
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <CheckSquare className="h-6 w-6 text-green-500" />
                    Tasks
                </h1>
            </div>

            <form onSubmit={addTask} className="flex gap-2">
                <Input
                    placeholder="משימה חדשה..."
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4" />
                </Button>
            </form>

            <div className="space-y-3">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`group flex items-center justify-between rounded-lg border p-4 transition-all ${task.is_completed ? 'bg-secondary/50 opacity-60' : 'bg-card'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`h-5 w-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${task.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground'}`}
                                onClick={() => toggleTask(task)}
                            >
                                {task.is_completed && <CheckSquare className="h-3.5 w-3.5" />}
                            </div>
                            <span className={task.is_completed ? 'line-through decoration-muted-foreground' : ''}>
                                {task.content}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteTask(task.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
