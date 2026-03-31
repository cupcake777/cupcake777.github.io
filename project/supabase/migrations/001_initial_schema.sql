-- Cat Journal initial schema
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
alter default privileges in schema public revoke all on tables from public;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- Create cat_journal table
create table if not exists public.cat_journal (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  sentiment integer,
  tags jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.cat_journal enable row level security;

-- Create policies
create policy "Users can view their own records"
  on public.cat_journal for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own records"
  on public.cat_journal for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own records"
  on public.cat_journal for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own records"
  on public.cat_journal for delete
  using ( auth.uid() = user_id );

-- Create index for faster queries
create index if not exists cat_journal_user_id_idx on public.cat_journal(user_id);
create index if not exists cat_journal_created_at_idx on public.cat_journal(created_at desc);

-- Grant permissions
grant select, insert, update, delete on public.cat_journal to authenticated;