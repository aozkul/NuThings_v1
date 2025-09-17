-- (İsteğe bağlı) Ürün istatistikleri için örnek tablo ve RPC
create table if not exists public.product_stats (
  product_id uuid references public.products(id) on delete cascade,
  likes int default 0,
  clicks int default 0,
  updated_at timestamptz default now()
);

create or replace function public.get_metrics()
returns table(product_id uuid, product_title text, clicks int, likes int)
language sql stable as $$
  select p.id, p.name, coalesce(s.clicks,0) as clicks, coalesce(s.likes,0) as likes
  from public.products p
  left join public.product_stats s on s.product_id = p.id
  order by coalesce(s.likes,0) desc, coalesce(s.clicks,0) desc
  limit 20;
$$;

-- Likes/Clicks increment RPCs (SECURITY DEFINER, RLS bypass)
create or replace function public.increment_like(pid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_stats (product_id, likes, clicks)
    values (pid, 1, 0)
  on conflict (product_id) do update set likes = public.product_stats.likes + 1, updated_at = now();
end; $$;

create or replace function public.increment_click(pid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_stats (product_id, likes, clicks)
    values (pid, 0, 1)
  on conflict (product_id) do update set clicks = public.product_stats.clicks + 1, updated_at = now();
end; $$;

-- Allow unlike: decrement_like (no negative)
create or replace function public.decrement_like(pid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_stats (product_id, likes, clicks)
    values (pid, 0, 0)
  on conflict (product_id) do update
    set likes = greatest(public.product_stats.likes - 1, 0),
        updated_at = now();
end; $$;

-- Make sure anon & authenticated can EXECUTE the RPCs
grant execute on function public.increment_like(uuid)   to anon, authenticated;
grant execute on function public.decrement_like(uuid)   to anon, authenticated;
grant execute on function public.increment_click(uuid)  to anon, authenticated;
