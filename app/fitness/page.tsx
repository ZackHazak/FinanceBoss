"use client"

import { useState } from "react"
import { FitnessSpreadsheet } from "./components/fitness-spreadsheet"
import { Button } from "@/components/ui-components"

export default function FitnessPage() {
    const [selectedDay, setSelectedDay] = useState<string>("Push")

    const days = ["Push", "Pull", "Legs"]

    return (
        <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fitness Log</h1>
                    <p className="text-muted-foreground">Track your progress, one rep at a time.</p>
                </div>

                <div className="flex p-1 bg-muted rounded-lg">
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${selectedDay === day
                                ? "bg-white text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <FitnessSpreadsheet dayName={selectedDay} />
        </div>
    )
}
