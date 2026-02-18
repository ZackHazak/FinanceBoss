"use client"

import { FitnessProgress } from "./components/fitness-progress"
import { TrendingUp } from "lucide-react"

export default function FitnessPage() {
    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-lg">
                            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                        מעקב התקדמות
                    </h1>
                    <p className="text-slate-500 mt-1">עקוב אחרי הנפח וההתקדמות שלך באימונים</p>
                </div>
            </div>

            <FitnessProgress />
        </div>
    )
}
