-- Fitness Module Tables Migration
-- Run this in Supabase SQL Editor

-- 1. PPL Workouts Table (stores workout logs)
CREATE TABLE IF NOT EXISTS ppl_workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    workout_type TEXT NOT NULL,
    exercises_data JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Training Settings Table (stores user training preferences)
CREATE TABLE IF NOT EXISTS training_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    current_week INTEGER DEFAULT 1,
    deload_frequency INTEGER DEFAULT 6, -- Deload every X weeks
    program_start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE ppl_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for public access (for development)
-- ppl_workouts policies
CREATE POLICY "Allow public read access on ppl_workouts" ON ppl_workouts
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on ppl_workouts" ON ppl_workouts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on ppl_workouts" ON ppl_workouts
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on ppl_workouts" ON ppl_workouts
    FOR DELETE USING (true);

-- training_settings policies
CREATE POLICY "Allow public read access on training_settings" ON training_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on training_settings" ON training_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on training_settings" ON training_settings
    FOR UPDATE USING (true);

-- 5. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ppl_workouts_created_at ON ppl_workouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppl_workouts_workout_type ON ppl_workouts(workout_type);

-- 6. Insert default training settings (for anonymous users)
INSERT INTO training_settings (id, current_week, deload_frequency, program_start_date)
VALUES ('00000000-0000-0000-0000-000000000001', 1, 6, CURRENT_DATE)
ON CONFLICT DO NOTHING;
