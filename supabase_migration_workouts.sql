-- Create workouts table for Body section
create table if not exists public.workouts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  workout_type text not null,
  duration integer not null,
  intensity integer check (intensity >= 1 and intensity <= 10) not null,
  notes text default ''
);

-- Enable Row Level Security
alter table public.workouts enable row level security;

-- Create policy for public access (for development)
create policy "Enable all access for now"
on public.workouts
for all
using (true)
with check (true);

-- Create index for faster queries
create index workouts_created_at_idx on public.workouts (created_at desc);
