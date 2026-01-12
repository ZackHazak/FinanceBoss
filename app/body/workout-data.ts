// PPL Program Data
export const WORKOUT_CYCLE = ["PULL", "PUSH", "LEGS"] as const
export type WorkoutType = typeof WORKOUT_CYCLE[number]

export interface Exercise {
    name: string
    sets: number
    reps: number | string
    rpe: number
}

export interface Program {
    name: string
    gradient: string
    bgGlow: string
    borderGlow: string
    exercises: Exercise[]
}


export const WORKOUT_PROGRAMS: Record<WorkoutType, Program> = {
    PULL: {
        name: "PULL",
        gradient: "from-blue-500 via-blue-600 to-indigo-600",
        bgGlow: "bg-blue-500/10",
        borderGlow: "border-blue-500/20",
        exercises: [
            { name: "Back Rows", sets: 1, reps: 8, rpe: 10 },
            { name: "Pullover", sets: 1, reps: 10, rpe: 10 },
            { name: "Cable Shrugs", sets: 1, reps: 10, rpe: 10 },
            { name: "Biceps (Barbell Curl)", sets: 1, reps: 10, rpe: 10 },
            { name: "Biceps (Cable/Machine)", sets: 1, reps: 10, rpe: 10 },
        ]
    },
    PUSH: {
        name: "PUSH",
        gradient: "from-red-500 via-orange-600 to-pink-600",
        bgGlow: "bg-red-500/10",
        borderGlow: "border-red-500/20",
        exercises: [
            { name: "Chest Press", sets: 1, reps: 8, rpe: 10 },
            { name: "Pec Deck Fly", sets: 1, reps: 10, rpe: 10 },
            { name: "Egyptian/Machine Lateral Raises", sets: 1, reps: 8, rpe: 10 },
            { name: "Shoulder Press", sets: 1, reps: 10, rpe: 10 },
            { name: "Triceps Cable Pushdowns", sets: 1, reps: 8, rpe: 10 },
            { name: "Single Arm Cable Triceps", sets: 1, reps: 10, rpe: 10 },
        ]
    },
    LEGS: {
        name: "LEGS",
        gradient: "from-green-500 via-emerald-600 to-teal-600",
        bgGlow: "bg-green-500/10",
        borderGlow: "border-green-500/20",
        exercises: [
            { name: "Hack Squat / Squat / Leg Press", sets: 1, reps: 8, rpe: 10 },
            { name: "RDL", sets: 1, reps: 8, rpe: 10 },
            { name: "Leg Extension", sets: 1, reps: "10-12", rpe: 10 },
            { name: "Leg Curl", sets: 1, reps: "10-12", rpe: 10 },
            { name: "Gastrocnemius (Calves)", sets: 1, reps: "12-15", rpe: 10 },
        ]
    }
}
