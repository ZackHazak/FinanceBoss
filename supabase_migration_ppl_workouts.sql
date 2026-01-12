-- Create PPL workouts table for structured workout logging
create table if not exists public.ppl_workouts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  workout_type text not null check (workout_type in ('PULL', 'PUSH', 'LEGS')),
  exercises_data jsonb not null default '[]'::jsonb
);

-- Enable Row Level Security
alter table public.ppl_workouts enable row level security;

-- Create policy for public access (for development)
create policy "Enable all access for ppl_workouts"
on public.ppl_workouts
for all
using (true)
with check (true);

-- Create index for faster queries
create index ppl_workouts_created_at_idx on public.ppl_workouts (created_at desc);
create index ppl_workouts_type_idx on public.ppl_workouts (workout_type);

-- Add comment
comment on table public.ppl_workouts is 'Stores workout logs for Push/Pull/Legs split program with exercise data as JSONB';
