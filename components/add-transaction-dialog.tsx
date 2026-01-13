"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button, Input } from "@/components/ui-components"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui-dialog"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/types/finance"

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [category, setCategory] = useState("other")
  const [customCategory, setCustomCategory] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const amountValue = parseFloat(amount)
    if (isNaN(amountValue)) {
      alert("נא להזין סכום תקין")
      setLoading(false)
      return
    }

    // Adjust amount based on type (negative for expense)
    const finalAmount = type === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue)

    // Use custom category if selected, otherwise use dropdown value
    const finalCategory = showCustomInput && customCategory.trim()
      ? customCategory.trim()
      : category

    const { error } = await supabase.from("transactions").insert({
      amount: finalAmount,
      description,
      type,
      category: finalCategory,
    })

    if (error) {
      console.error(error)
      alert(`Error: ${error.message}`)
    } else {
      setOpen(false)
      setAmount("")
      setDescription("")
      setCategory("other")
      setCustomCategory("")
      setShowCustomInput(false)
      router.refresh() // Refresh server components
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-auto flex-col gap-2 py-6 text-sm flex-1" variant="outline">
          <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30">
            <Plus className="h-5 w-5" />
          </div>
          הוסף תנועה
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת תנועה חדשה</DialogTitle>
          <DialogDescription>
            הזן את פרטי ההכנסה או ההוצאה שלך כאן.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="flex gap-2 justify-center mb-2">
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              onClick={() => setType("income")}
              className={`flex-1 ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              הכנסה
            </Button>
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              onClick={() => setType("expense")}
              className={`flex-1 ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              הוצאה
            </Button>
          </div>
          <div className="grid gap-2">
            <label htmlFor="amount" className="text-sm font-medium">
              סכום
            </label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              תיאור
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="לדוגמה: קניות בסופר"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="category" className="text-sm font-medium">
              קטגוריה
            </label>
            <select
              id="category"
              value={showCustomInput ? "_custom" : category}
              onChange={(e) => {
                if (e.target.value === "_custom") {
                  setShowCustomInput(true)
                } else {
                  setShowCustomInput(false)
                  setCategory(e.target.value)
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
              <option value="_custom">✏️ מותאם אישית...</option>
            </select>
            {showCustomInput && (
              <Input
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="הזן שם קטגוריה"
                autoFocus
                required
              />
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "שומר..." : "שמור תנועה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
