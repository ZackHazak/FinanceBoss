// Workout Program Data - Based on Weekly Schedule
// ראשון/שני: חזה+כתפיים, גב+כתף אחורית
// שלישי: התאוששות אקטיבית
// רביעי/חמישי: פלג גוף תחתון, פלג גוף עליון + פינישים
// שישי/שבת: מנוחה

export const WORKOUT_CYCLE = [
    "CHEST_SHOULDERS",      // יום ראשון: חזה + כתפיים
    "BACK_REAR_DELT",       // יום שני: גב + כתף אחורית
    "ACTIVE_RECOVERY",      // יום שלישי: התאוששות אקטיבית
    "LOWER_BODY",           // יום רביעי: פלג גוף תחתון
    "UPPER_FINISHERS"       // יום חמישי: פלג גוף עליון + פינישים
] as const

export type WorkoutType = typeof WORKOUT_CYCLE[number]

export interface Exercise {
    name: string
    nameHe: string
    sets: number
    reps: string // e.g., "8-15" for compound, "12-30" for isolation
    isCompound: boolean
}

export interface Program {
    name: string
    nameHe: string
    dayHe: string
    gradient: string
    bgGlow: string
    borderGlow: string
    icon: string
    exercises: Exercise[]
    isRecovery?: boolean
}

export const WORKOUT_PROGRAMS: Record<WorkoutType, Program> = {
    CHEST_SHOULDERS: {
        name: "CHEST + SHOULDERS",
        nameHe: "חזה + כתפיים",
        dayHe: "יום ראשון",
        gradient: "from-red-500 via-orange-500 to-pink-600",
        bgGlow: "bg-red-500/10",
        borderGlow: "border-red-500/20",
        icon: "💪",
        exercises: [
            { name: "Cable Fly / Pec Deck", nameHe: "פרפר בכבלים / מכונת פרפר", sets: 3, reps: "12-15", isCompound: false },
            { name: "Incline Press 30° / Smith", nameHe: "לחיצת חזה בשיפוע 30 מעלות / סמית'", sets: 2, reps: "8-12", isCompound: true },
            { name: "Chest Press Machine", nameHe: "לחיצת חזה במכונה לבחירה", sets: 3, reps: "8-12", isCompound: true },
            { name: "Lateral Raises", nameHe: "הרחקת כתפיים עם דאמבלים / במכונה", sets: 2, reps: "12-20", isCompound: false },
            { name: "Front Raises", nameHe: "הרמות קדמיות עם דאמבלים / כבל", sets: 2, reps: "12-20", isCompound: false },
            { name: "Upright Row", nameHe: "חתירה אנכית עם מוט", sets: 2, reps: "10-15", isCompound: true },
        ]
    },
    BACK_REAR_DELT: {
        name: "BACK + REAR DELT",
        nameHe: "גב + כתף אחורית",
        dayHe: "יום שני",
        gradient: "from-blue-500 via-indigo-500 to-purple-600",
        bgGlow: "bg-blue-500/10",
        borderGlow: "border-blue-500/20",
        icon: "🔙",
        exercises: [
            { name: "T-Bar Row (Chest Supported)", nameHe: "חתירת במוט T עם תמיכת חזה", sets: 2, reps: "8-12", isCompound: true },
            { name: "Lat Pulldown", nameHe: "פולי עליון אחיזה רגילה / הפוכה", sets: 3, reps: "8-12", isCompound: true },
            { name: "Incline Dumbbell Row", nameHe: "חתירה בשכיבה על ספסל בשיפוע", sets: 3, reps: "8-12", isCompound: true },
            { name: "Any Row Variation", nameHe: "וריאציית חתירה אהובה לבחירה", sets: 2, reps: "8-15", isCompound: true },
            { name: "Cable Pullover", nameHe: "פולאובר בכבלים", sets: 3, reps: "12-15", isCompound: false },
            { name: "Rear Delt Fly", nameHe: "פרפר אחורי בכבל / מכונה", sets: 3, reps: "15-20", isCompound: false },
        ]
    },
    ACTIVE_RECOVERY: {
        name: "ACTIVE RECOVERY",
        nameHe: "התאוששות אקטיבית",
        dayHe: "יום שלישי",
        gradient: "from-green-400 via-teal-500 to-cyan-500",
        bgGlow: "bg-green-500/10",
        borderGlow: "border-green-500/20",
        icon: "🧘",
        isRecovery: true,
        exercises: [
            { name: "Stretching", nameHe: "מתיחות", sets: 1, reps: "15-20 דקות", isCompound: false },
            { name: "Light Walk", nameHe: "הליכה רגועה וארוכה", sets: 1, reps: "30-45 דקות", isCompound: false },
            { name: "Incline Walk (No Hands)", nameHe: "הליכה בשיפוע ללא ידיים", sets: 1, reps: "30 דקות", isCompound: false },
        ]
    },
    LOWER_BODY: {
        name: "LOWER BODY",
        nameHe: "פלג גוף תחתון",
        dayHe: "יום חמישי",
        gradient: "from-emerald-500 via-green-500 to-lime-600",
        bgGlow: "bg-emerald-500/10",
        borderGlow: "border-emerald-500/20",
        icon: "🦵",
        exercises: [
            { name: "Hip Abductor Machine", nameHe: "מכונת מרחיקי ירך (Abductor)", sets: 3, reps: "15-20", isCompound: false },
            { name: "Leg Press / Hack Squat", nameHe: "לחיצת רגליים / האק סקוואט / סקוואט במכונה", sets: 2, reps: "8-12", isCompound: true },
            { name: "Leg Curl", nameHe: "כפיפות ברכיים בישיבה / שכיבה", sets: 3, reps: "12-15", isCompound: false },
            { name: "Leg Extension", nameHe: "פשיטת ברך רגל רגל", sets: 3, reps: "12-15", isCompound: false },
            { name: "Hip Adductor Machine", nameHe: "מכונת מקרבי ירך (Adductor)", sets: 3, reps: "15-20", isCompound: false },
            { name: "Calf Exercise", nameHe: "תרגיל תאומים לבחירה", sets: 3, reps: "15-20", isCompound: false },
        ]
    },
    UPPER_FINISHERS: {
        name: "UPPER + FINISHERS",
        nameHe: "פלג גוף עליון + פינישים",
        dayHe: "יום שישי",
        gradient: "from-purple-500 via-fuchsia-500 to-pink-600",
        bgGlow: "bg-purple-500/10",
        borderGlow: "border-purple-500/20",
        icon: "🔥",
        exercises: [
            { name: "Shoulder Press Machine", nameHe: "לחיצת כתפיים במכונה לבחירה", sets: 3, reps: "8-12", isCompound: true },
            { name: "Cable Fly / Pec Deck", nameHe: "פרפר בכבלים / מכונה לחזה", sets: 2, reps: "12-15", isCompound: false },
            { name: "Preacher Curl", nameHe: "כפיפות מרפקים לבחירה בפריצ'ר", sets: 3, reps: "12-15", isCompound: false },
            { name: "Skull Crushers", nameHe: "סקול קראשר וריאציה אהובה לבחירה", sets: 3, reps: "12-15", isCompound: false },
            { name: "Dips (Machine/Free)", nameHe: "מקבילים במכונה / עם משקל חופשי", sets: 2, reps: "8-15", isCompound: true },
            { name: "Cable Hammer Curl", nameHe: "כפיפות פטיש בכבל עם חבל", sets: 3, reps: "12-15", isCompound: false },
        ]
    }
}

// Training Notes (הערות כלליות)
export const TRAINING_NOTES = {
    compound_reps: "8-15", // תרגילים מורכבים
    isolation_reps: "12-30", // תרגילים מבודדים
    warmup_note: "הסטים הרשומים אינם כוללים סט חימום, זה לפי הרגשה"
}

// Nutrition Guidelines (מאזן קלוריות)
export const NUTRITION_GUIDELINES = {
    find_neutral: "עקוב אחרי כל המאכלים במשך 3-4 ימים רצופים כדי למצוא את הצריכה האינסטינקטיבית",
    cutting: {
        deficit: "300-500 קלוריות גירעון",
        expected_loss: "0.75%-1% ממשקל הגוף כל שבוע"
    },
    bulking: {
        surplus: "300-500 קלוריות עודף",
        expected_gain: "1%-1.5% ממשקל הגוף כל חודש"
    }
}

// Best Foods (מאכלים מומלצים)
export const BEST_FOODS = {
    protein: [
        { name: "בשר דל שומן", nameEn: "Lean Meat" },
        { name: "חזה עוף", nameEn: "Chicken Breast" },
        { name: "חזה הודו טחון", nameEn: "Ground Turkey" },
        { name: "ביצים שלמות", nameEn: "Whole Eggs" },
        { name: "דג סלמון", nameEn: "Salmon" },
        { name: "מעדן / משקה חלבון", nameEn: "Protein Shake/Pudding" },
    ],
    carbs: [
        { name: "תפוח אדמה", nameEn: "Potato" },
        { name: "בטטה", nameEn: "Sweet Potato" },
        { name: "אורז יסמין", nameEn: "Jasmine Rice" },
        { name: "שיבולת שועל", nameEn: "Oatmeal" },
    ],
    fats: [
        { name: "אבוקדו", nameEn: "Avocado" },
        { name: "שמן זית", nameEn: "Olive Oil" },
    ],
    other: [
        { name: "פירות", nameEn: "Fruits" },
        { name: "ירקות ירוקים", nameEn: "Green Vegetables" },
    ]
}

// Meal Ideas (רעיונות לארוחות)
export const MEAL_IDEAS = [
    { name: "מוקפץ StirFry אורז, בשר טחון וירקות", icon: "🍳" },
    { name: "ביצים על טוסט אבוקדו וגבינה דלת שומן + ירקות", icon: "🥑" },
    { name: "סלמון ותפוח אדמה בתנור", icon: "🐟" },
    { name: "המבורגר ביתי מבשר דל שומן", icon: "🍔" },
    { name: "מעדן חלבון + פירות קפואים וחמאת בוטנים טבעית", icon: "🥤" },
    { name: "סלט חזה עוף ירוק + שמן זית + פריכיות מפורות", icon: "🥗" },
    { name: "סטייק ופירה בטטה", icon: "🥩" },
    { name: "סנדוויץ וטוסט פסטרמה / גבינה צהובה דלת שומן", icon: "🥪" },
    { name: "שיבולת + אבקת חלבון + פירות + חמאת בוטנים", icon: "🥣" },
]

// Week Schedule Display
export const WEEK_SCHEDULE = [
    { day: "ראשון", workout: "CHEST_SHOULDERS", type: "training" },
    { day: "שני", workout: "BACK_REAR_DELT", type: "training" },
    { day: "שלישי", workout: "ACTIVE_RECOVERY", type: "recovery" },
    { day: "רביעי", workout: null, type: "rest" },
    { day: "חמישי", workout: "LOWER_BODY", type: "training" },
    { day: "שישי", workout: "UPPER_FINISHERS", type: "training" },
    { day: "שבת", workout: null, type: "rest" },
] as const

// Deload Configuration
export const DELOAD_CONFIG = {
    frequency: 6, // DELOAD every 6 weeks
    intensityReduction: 50, // Reduce intensity by 50%
    message: "שבוע DELOAD - הורד עומס ב-50%"
}

// Helper to calculate current week number
export function calculateWeekNumber(workoutLogs: { created_at: string }[]): number {
    if (workoutLogs.length === 0) return 1

    // Get the first workout date
    const sortedLogs = [...workoutLogs].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const firstWorkoutDate = new Date(sortedLogs[0].created_at)
    const today = new Date()

    // Calculate weeks since first workout
    const diffTime = Math.abs(today.getTime() - firstWorkoutDate.getTime())
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))

    return diffWeeks
}

// Check if current week is a deload week
export function isDeloadWeek(weekNumber: number): boolean {
    return weekNumber > 0 && weekNumber % DELOAD_CONFIG.frequency === 0
}

// Get weeks until next deload
export function getWeeksUntilDeload(weekNumber: number): number {
    const remaining = DELOAD_CONFIG.frequency - (weekNumber % DELOAD_CONFIG.frequency)
    return remaining === DELOAD_CONFIG.frequency ? 0 : remaining
}
