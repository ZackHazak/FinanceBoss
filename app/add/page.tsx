"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui-components"
import { supabase } from "@/lib/supabase"
import { ArrowUpRight, ArrowDownRight, Save } from "lucide-react"

export default function AddPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<"income" | "expense">("expense")
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("כללי")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const categories = [
        "כללי", "אוכל", "תחבורה", "מגורים", "בילויים", "משכורת", "השקעות", "מתנות", "בריאות"
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const amountValue = parseFloat(amount)
        if (isNaN(amountValue)) {
            alert("נא להזין סכום תקין")
            setLoading(false)
            return
        }

        // Adjust amount based on type
        const finalAmount = type === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue)
        // Combine date with current time for easier sorting later if needed, or just ISO string
        const timestamp = new Date(date).toISOString()

        const { error } = await supabase.from("transactions").insert({
            amount: finalAmount,
            description,
            type,
            category,
            created_at: timestamp
        })

        if (error) {
            console.error(error)
            alert(`Error saving: ${error.message}`)
        } else {
            router.push('/')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="mx-auto max-w-lg space-y-6 p-6">
            <h1 className="text-2xl font-bold">הוספת תנועה</h1>

            <Card>
                <CardHeader>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={type === "income" ? "default" : "outline"}
                            onClick={() => setType("income")}
                            className={`flex-1 gap-2 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            הכנסה
                        </Button>
                        <Button
                            type="button"
                            variant={type === "expense" ? "default" : "outline"}
                            onClick={() => setType("expense")}
                            className={`flex-1 gap-2 ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        >
                            <ArrowDownRight className="h-4 w-4" />
                            הוצאה
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">סכום</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="text-lg"
                                inputMode="decimal"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">תיאור</label>
                            <Input
                                placeholder="מה קנינו?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">קטגוריה</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">תאריך</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full gap-2" disabled={loading}>
                            <Save className="h-4 w-4" />
                            {loading ? "שומר..." : "שמור תנועה"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
