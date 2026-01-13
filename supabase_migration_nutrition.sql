-- Nutrition Module Tables
-- Run this migration in your Supabase SQL Editor

-- 1. Foods table - stores food items (from API or manual entry)
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_he TEXT, -- Hebrew name
    brand TEXT,
    serving_size NUMERIC DEFAULT 100,
    serving_unit TEXT DEFAULT 'g',
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    fiber NUMERIC DEFAULT 0,
    sugar NUMERIC DEFAULT 0,
    sodium NUMERIC DEFAULT 0,
    api_id TEXT, -- External API ID (USDA, etc.)
    api_source TEXT, -- 'usda', 'openfoodfacts', 'manual'
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Meals table - groups food entries by meal type
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Meal items - individual food entries within a meal
CREATE TABLE meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    custom_name TEXT, -- For quick entries without full food data
    quantity NUMERIC DEFAULT 1,
    serving_size NUMERIC DEFAULT 100,
    serving_unit TEXT DEFAULT 'g',
    -- Calculated values (stored for performance)
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Water intake tracking
CREATE TABLE water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    amount_ml NUMERIC NOT NULL DEFAULT 250,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Weight tracking
CREATE TABLE weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE UNIQUE,
    weight_kg NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. Daily nutrition goals
CREATE TABLE nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calories_target NUMERIC DEFAULT 2000,
    protein_target NUMERIC DEFAULT 150,
    carbs_target NUMERIC DEFAULT 200,
    fat_target NUMERIC DEFAULT 65,
    water_target_ml NUMERIC DEFAULT 2500,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (public access for now, like other tables)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (public access)
CREATE POLICY "Allow all access to foods" ON foods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to meals" ON meals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to meal_items" ON meal_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to water_logs" ON water_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to weight_logs" ON weight_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nutrition_goals" ON nutrition_goals FOR ALL USING (true) WITH CHECK (true);

-- Insert default nutrition goals
INSERT INTO nutrition_goals (calories_target, protein_target, carbs_target, fat_target, water_target_ml)
VALUES (2000, 150, 200, 65, 2500);

-- Create indexes for performance
CREATE INDEX idx_meals_date ON meals(date);
CREATE INDEX idx_meal_items_meal_id ON meal_items(meal_id);
CREATE INDEX idx_water_logs_date ON water_logs(date);
CREATE INDEX idx_weight_logs_date ON weight_logs(date);
CREATE INDEX idx_foods_api_id ON foods(api_id);
