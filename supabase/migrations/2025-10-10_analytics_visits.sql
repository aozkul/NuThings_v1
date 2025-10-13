
-- Analytics visits table
create table if not exists public.analytics_visits (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  path text not null,
  country text not null default 'ZZ',
  ip_hash text not null,
  user_agent text,
  referrer text
);

-- Indexes
create index if not exists idx_analytics_visits_ts on public.analytics_visits (ts desc);
create index if not exists idx_analytics_visits_country on public.analytics_visits (country);
create index if not exists idx_analytics_visits_path on public.analytics_visits (path);
create index if not exists idx_analytics_visits_iphash on public.analytics_visits (ip_hash);

-- Enable RLS and allow anon to insert/select basic aggregates
alter table public.analytics_visits enable row level security;

-- Allow inserts from anon key
drop policy if exists "allow insert anon" on public.analytics_visits;
create policy "allow insert anon"
on public.analytics_visits
for insert
to anon
with check (true);
-- Allow read for anon (you may tighten later)
create policy "allow read anon"
on public.analytics_visits
for select
to anon
using (true);

-- Helper views/functions for admin dashboard

-- 1) Daily visits last N days
create or replace function public.analytics_daily(p_days int default 30)
returns table(day text, count int)
language sql stable
as $$
  select to_char(date_trunc('day', ts), 'YYYY-MM-DD') as day, count(*)::int
  from public.analytics_visits
  where ts >= now() - make_interval(days => p_days)
  group by 1
  order by 1;
$$;

-- 2) Top countries
create or replace function public.analytics_by_country(p_limit int default 12)
returns table(key text, count int)
language sql stable
as $$
  select country as key, count(*)::int
  from public.analytics_visits
  group by 1
  order by count(*) desc
  limit p_limit;
$$;

-- 3) Top paths
create or replace function public.analytics_by_path(p_limit int default 12)
returns table(key text, count int)
language sql stable
as $$
  select path as key, count(*)::int
  from public.analytics_visits
  group by 1
  order by count(*) desc
  limit p_limit;
$$;

-- 4) Totals including uniques by ip_hash
create or replace function public.analytics_totals()
returns table(total int, uniques int)
language sql stable
as $$
  select count(*)::int as total, count(distinct ip_hash)::int as uniques
  from public.analytics_visits;
$$;
