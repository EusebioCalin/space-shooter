-- Run this once in the Supabase SQL editor to create the user_preferences table.

create table public.user_preferences (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  selected_ship text not null default 'xwing'
    check (selected_ship in ('xwing', 'awing', 'ywing')),
  updated_at   timestamptz not null default now()
);

-- Row-Level Security: users can only read and write their own row
alter table public.user_preferences enable row level security;

create policy "owner read" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "owner insert" on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy "owner update" on public.user_preferences
  for update using (auth.uid() = user_id);
