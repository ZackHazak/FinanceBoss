    -- Create table for Fitness Targets (The Template/Plan)
create table if not exists fitness_targets (
    id uuid default gen_random_uuid() primary key,
    day_name text not null, -- 'Push', 'Pull', 'Legs'
    order_index integer default 0,
    exercise_name text not null,
    target_sets text default '',
    target_reps text default '',
    target_rpe text default '',
    target_rest text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- No seed data - you can add exercises via the UI using the "Add Exercise" button


-- Create table for Fitness Logs (The User Inputs)
create table if not exists fitness_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid default auth.uid(),
    date date not null default CURRENT_DATE,
    target_id uuid references fitness_targets(id) not null,
    set_1 text default '',
    set_2 text default '',
    set_3 text default '',
    set_4 text default '',
    notes text default '',
    lsrpe text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Ensure one log entry per exercise per date (for now) to avoid duplicates
    unique(date, target_id)
);


-- Create table for Daily Summary (Footer inputs like Total Time)
create table if not exists fitness_daily_summary (
    id uuid default gen_random_uuid() primary key,
    user_id uuid default auth.uid(),
    date date not null default CURRENT_DATE,
    day_name text not null, -- 'Push', 'Pull', etc.
    total_time text default '',
    total_volume numeric default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,

    unique(date)
);

-- Enable RLS
alter table fitness_targets enable row level security;
alter table fitness_logs enable row level security;
alter table fitness_daily_summary enable row level security;

-- Policies (Permissive)
create policy "Allow public read fitness_targets" on fitness_targets for select using (true);
create policy "Allow public insert fitness_targets" on fitness_targets for insert with check (true);
create policy "Allow public update fitness_targets" on fitness_targets for update using (true);
create policy "Allow public read fitness_logs" on fitness_logs for select using (true);
create policy "Allow public insert fitness_logs" on fitness_logs for insert with check (true);
create policy "Allow public update fitness_logs" on fitness_logs for update using (true);

create policy "Allow public read fitness_daily_summary" on fitness_daily_summary for select using (true);
create policy "Allow public insert fitness_daily_summary" on fitness_daily_summary for insert with check (true);
create policy "Allow public update fitness_daily_summary" on fitness_daily_summary for update using (true);
