-- Create Workouts Table
create table if not exists workouts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  sets integer default 0,
  reps integer default 0,
  weight numeric default 0
);

-- Create Journal Table
create table if not exists journal (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null
);

-- Create Tasks Table
create table if not exists tasks (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  is_completed boolean default false
);

-- Allow public access for now (Development Mode)
alter table workouts enable row level security;
create policy "Enable all access for workouts" on workouts for all using (true) with check (true);

alter table journal enable row level security;
create policy "Enable all access for journal" on journal for all using (true) with check (true);

alter table tasks enable row level security;
create policy "Enable all access for tasks" on tasks for all using (true) with check (true);
