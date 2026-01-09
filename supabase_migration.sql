-- Create transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  description text not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null
);

-- Set up Row Level Security (RLS)
-- For now, we'll allow public access mainly for development speed as requested ("blank app I can put data").
-- In production, you'd want to enable RLS and restrict to authenticated users.
alter table public.transactions enable row level security;

create policy "Enable all access for now"
on public.transactions
for all
using (true)
with check (true);
