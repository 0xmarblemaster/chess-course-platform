-- Trial links schema for expiring, multi-use invite links

create table if not exists public.trial_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '72 hours'),
  enabled boolean not null default true,
  max_uses int null,
  use_count int not null default 0,
  notes text null
);

create index if not exists trial_links_code_idx on public.trial_links (code);
create index if not exists trial_links_expires_idx on public.trial_links (expires_at);

create table if not exists public.trial_link_targets (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.trial_links(id) on delete cascade,
  level_group_id int null references public.level_groups(id) on delete cascade,
  level_id int null references public.levels(id) on delete cascade,
  lesson_id int null references public.lessons(id) on delete cascade,
  max_courses_per_level int null,
  max_lessons_per_course int null,
  check (
    level_group_id is not null or level_id is not null or lesson_id is not null
  )
);

create index if not exists trial_link_targets_link_idx on public.trial_link_targets (link_id);

create table if not exists public.trial_sessions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.trial_links(id) on delete cascade,
  session_token text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz null,
  ip inet null,
  country text null,
  user_agent text null,
  revoked_at timestamptz null
);

create index if not exists trial_sessions_link_idx on public.trial_sessions (link_id);
create index if not exists trial_sessions_last_seen_idx on public.trial_sessions (last_seen_at);

create table if not exists public.trial_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.trial_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('activate','pageview','complete_lesson','end')),
  route text null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists trial_events_session_idx on public.trial_events (session_id);
create index if not exists trial_events_created_idx on public.trial_events (created_at);

-- RLS policies should be tailored to your auth model. Example:
-- alter table public.trial_links enable row level security;
-- create policy "admins manage trial links" on public.trial_links
--   for all using (auth.role() = 'admin') with check (auth.role() = 'admin');


