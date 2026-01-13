"use client"

import { FitnessProgress } from "./components/fitness-progress"
import { LineChart } from "lucide-react"

export default function FitnessPage() {
    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <LineChart className="h-8 w-8 text-blue-600" />
                        Fitness Tracker
                    </h1>
                    <p className="text-slate-500">Track your PPL volume progress and deload cycles.</p>
                </div>
            </div>

            <FitnessProgress />
        </div>
    )
}
