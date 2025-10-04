-- Create level_groups table (top-level category: "Levels")
create table if not exists public.level_groups (
  id bigint generated always as identity primary key,
  title text not null,
  description text default '' not null,
  order_index int default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- Add level_group_id to existing levels table
alter table public.levels
  add column if not exists level_group_id bigint references public.level_groups(id) on delete set null;

-- Seed a default group and attach existing levels if they are orphaned
insert into public.level_groups (title, description, order_index)
values ('Default Level Group', 'Default container for existing levels', 0)
on conflict do nothing;

-- Attach all levels that have null group to the default group
update public.levels
set level_group_id = (select id from public.level_groups order by id asc limit 1)
where level_group_id is null;

-- Optional: RLS (adjust to your security needs)
-- enable row level security if using RLS patterns
-- alter table public.level_groups enable row level security;
-- create policy "level_groups read" on public.level_groups
--   for select using (true);
-- create policy "level_groups write by admin" on public.level_groups
--   for all using (auth.role() = 'admin');
