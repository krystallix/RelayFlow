-- RelayFlow Database Schema for Supabase / Self-Hosted PostgreSQL
-- Projects Table with Row Level Security (RLS)

create table if not exists public.projects (
  id text primary key,             -- Unique project id (e.g. nanoid or 'c_8k2m9x')
  owner_id uuid references auth.users(id) on delete set null,
  title text not null default 'Untitled Circuit',
  data jsonb not null,             -- Circuit JSON payload containing { nodes, wires, settings }
  is_public boolean default true,  -- true allows public access for viewer mode via /c/[id]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);

-- Enable Row Level Security
alter table public.projects enable row level security;

-- Policy 1: Anyone can read public projects; authenticated owners can read their own private ones
drop policy if exists "Public and owner select" on public.projects;
create policy "Public and owner select" on public.projects
  for select using (is_public = true or auth.uid() = owner_id);

-- Policy 2: Authenticated users can insert their own projects
drop policy if exists "Owner insert" on public.projects;
create policy "Owner insert" on public.projects
  for insert with check (auth.uid() = owner_id);

-- Policy 3: Owners can update their own projects
drop policy if exists "Owner update" on public.projects;
create policy "Owner update" on public.projects
  for update using (auth.uid() = owner_id);

-- Policy 4: Owners can delete their own projects
drop policy if exists "Owner delete" on public.projects;
create policy "Owner delete" on public.projects
  for delete using (auth.uid() = owner_id);
