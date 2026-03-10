-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor) to create the projects table and RLS.
-- Then enable Google in Authentication → Providers and add your redirect URL.

-- Projects table: one row per user's current project (soft launch: single project per user).
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Keep updated_at in sync.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- RLS: users can only read/write their own project.
alter table public.projects enable row level security;

create policy "Users can read own project"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own project"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own project"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own project"
  on public.projects for delete
  using (auth.uid() = user_id);
