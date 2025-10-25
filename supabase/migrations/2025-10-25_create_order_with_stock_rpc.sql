
-- Idempotent orders + stock RPC
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Ensure stock column
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='products' and column_name='stock'
  ) then
    alter table public.products add column stock int not null default 0;
  end if;
exception when others then null; end $$;

-- Orders tables
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_email text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- RPC: create order and decrement stock atomically
create or replace function public.create_order_with_stock(
  p_buyer_email text,
  p_items jsonb
)
returns table(order_id uuid)
language plpgsql
security definer
as $$
declare
  _order_id uuid := gen_random_uuid();
  _pid uuid;
  _qty int;
  _price numeric(12,2);
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'NO_ITEMS';
  end if;

  -- Check stock first
  for _pid, _qty in
    select (item->>'product_id')::uuid, (item->>'quantity')::int
    from jsonb_array_elements(p_items) as item
  loop
    if _qty <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;
    if not exists (select 1 from public.products where id=_pid) then
      raise exception 'PRODUCT_NOT_FOUND %', _pid;
    end if;
    if (select stock from public.products where id=_pid) < _qty then
      raise exception 'OUT_OF_STOCK %', _pid;
    end if;
  end loop;

  -- Create order
  insert into public.orders(id, buyer_email, status)
  values (_order_id, p_buyer_email, 'confirmed');

  -- Insert items and decrement stock
  for _pid, _qty in
    select (item->>'product_id')::uuid, (item->>'quantity')::int
    from jsonb_array_elements(p_items) as item
  loop
    select price into _price from public.products where id=_pid;
    insert into public.order_items(order_id, product_id, quantity, unit_price)
    values (_order_id, _pid, _qty, coalesce(_price,0));
    update public.products set stock = stock - _qty where id=_pid;
  end loop;

  return query select _order_id;
end
$$;

-- Allow anonymous/select as needed (adjust to your security model)
do $$ begin
  revoke all on function public.create_order_with_stock(text, jsonb) from public;
  grant execute on function public.create_order_with_stock(text, jsonb) to anon, authenticated;
exception when others then null; end $$;
