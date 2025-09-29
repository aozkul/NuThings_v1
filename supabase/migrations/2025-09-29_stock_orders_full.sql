-- Safe, idempotent stock + orders + RPC
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- PRODUCTS: add stock if missing
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='stock') then
    alter table public.products add column stock int not null default 0;
  end if;
end $$;

-- ORDERS tables
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_email text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null default 0
);
alter table public.order_items enable row level security;

-- indexes
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_product on public.order_items(product_id);

-- RLS: read public, write admins
drop policy if exists "Public read orders" on public.orders;
create policy "Public read orders" on public.orders for select using (true);

drop policy if exists "Public read order_items" on public.order_items;
create policy "Public read order_items" on public.order_items for select using (true);

drop policy if exists "Admins write orders" on public.orders;
create policy "Admins write orders"
  on public.orders for all
  using (exists (select 1 from public.admin_users a where a.id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.id = auth.uid()));

drop policy if exists "Admins write order_items" on public.order_items;
create policy "Admins write order_items"
  on public.order_items for all
  using (exists (select 1 from public.admin_users a where a.id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.id = auth.uid()));

-- RPC: place_order (atomic stock decrement)
drop function if exists public.place_order(jsonb, text);
create or replace function public.place_order(items jsonb, buyer_email text default null)
returns table(order_id uuid)
language plpgsql
security definer
as $$
declare
  _order_id uuid;
  _row jsonb;
  _pid uuid;
  _qty int;
  _price numeric(10,2);
begin
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'INVALID_ITEMS';
  end if;

  with flat as (
    select (x->>'product_id')::uuid as product_id,
           sum((x->>'quantity')::int) as qty
    from jsonb_array_elements(items) as x
    group by 1
  ),
  check_q as (
    select f.product_id, f.qty, p.stock
    from flat f
    join public.products p on p.id = f.product_id
    for update of p
  )
  select 1 into _qty from check_q where qty > stock limit 1;
  if found then
    raise exception 'OUT_OF_STOCK';
  end if;

  insert into public.orders(buyer_email, status)
  values (buyer_email, 'confirmed')
  returning id into _order_id;

  for _row in select jsonb_build_object('product_id', f.product_id, 'qty', f.qty)
              from (
                select (x->>'product_id')::uuid as product_id,
                       sum((x->>'quantity')::int) as qty
                from jsonb_array_elements(items) as x
                group by 1
              ) f
  loop
    _pid := (_row->>'product_id')::uuid;
    _qty := (_row->>'qty')::int;

    select price into _price from public.products where id = _pid;

    insert into public.order_items(order_id, product_id, quantity, unit_price)
    values (_order_id, _pid, _qty, coalesce(_price,0));

    update public.products
      set stock = stock - _qty
      where id = _pid;
  end loop;

  return query select _order_id;
end
$$;

revoke all on function public.place_order(jsonb, text) from public;
grant execute on function public.place_order(jsonb, text) to anon, authenticated;
