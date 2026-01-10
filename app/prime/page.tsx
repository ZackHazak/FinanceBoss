"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button, Card, CardContent } from "@/components/ui-components"
import { BookOpen, Send, ArrowRight } from "lucide-react"
import Link from "next/link"

interface JournalEntry {
    id: string
    created_at: string
    content: string
}

export default function PrimePage() {
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState("")

    useEffect(() => {
        fetchEntries()
    }, [])

    const fetchEntries = async () => {
        const { data } = await supabase
            .from('journal')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setEntries(data)
    }

    const handleSubmit = async () => {
        if (!content.trim()) return
        setLoading(true)

        const { error } = await supabase.from('journal').insert({ content })

        if (!error) {
            setContent("")
            fetchEntries()
        }
        setLoading(false)
    }

    return (
        <div className="mx-auto max-w-2xl p-6 space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link href="/" className="rounded-full bg-secondary p-2 hover:bg-secondary/80">
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-purple-500" />
                    Prime Journal
                </h1>
            </div>

            <div className="relative">
                <textarea
                    className="w-full h-32 rounded-xl border p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-card"
                    placeholder="מה עבר עליך היום?"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
                <Button
                    className="absolute bottom-4 left-4 rounded-full bg-purple-600 hover:bg-purple-700"
                    size="icon"
                    onClick={handleSubmit}
                    disabled={loading || !content.trim()}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-6">
                {entries.map(entry => (
                    <div key={entry.id} className="relative pl-6 border-l-2 border-primary/20">
                        <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary/40" />
                        <div className="text-xs text-muted-foreground mb-1">
                            {new Date(entry.created_at).toLocaleString("he-IL")}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                            {entry.content}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
