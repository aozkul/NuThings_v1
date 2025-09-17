create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  position int default 0,
  created_at timestamp with time zone default now()
);
alter table public.categories enable row level security;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  is_featured boolean default false,
  likes int not null default 0,
  views int not null default 0,
  created_at timestamp with time zone default now()
);
alter table public.products enable row level security;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  created_at timestamp with time zone default now()
);
alter table public.product_images enable row level security;

create table if not exists public.admin_users (
  id uuid primary key,
  email text unique
);
alter table public.admin_users enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products for select using (true);

drop policy if exists "Public read product_images" on public.product_images;
create policy "Public read product_images" on public.product_images for select using (true);

drop policy if exists "Admins write categories" on public.categories;
create policy "Admins write categories" on public.categories
  for all using (exists (select 1 from public.admin_users a where a.id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.id = auth.uid()));

drop policy if exists "Admins write products" on public.products;
create policy "Admins write products" on public.products
  for all using (exists (select 1 from public.admin_users a where a.id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.id = auth.uid()));

drop policy if exists "Admins write product_images" on public.product_images;
create policy "Admins write product_images" on public.product_images
  for all using (exists (select 1 from public.admin_users a where a.id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.id = auth.uid()));

drop policy if exists "Self can read admin_users" on public.admin_users;
create policy "Self can read admin_users" on public.admin_users
  for select using (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product-images" on storage.objects;
create policy "Public read product-images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins write product-images" on storage.objects;
create policy "Admins write product-images"
on storage.objects for all to authenticated
using (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.id = auth.uid()))
with check (bucket_id = 'product-images' and exists (select 1 from public.admin_users a where a.id = auth.uid()));

create or replace function public.bump_like(p_id uuid)
returns void language sql security definer as $$
  update public.products set likes = likes + 1 where id = p_id;
$$;
create or replace function public.bump_view(p_id uuid)
returns void language sql security definer as $$
  update public.products set views = views + 1 where id = p_id;
$$;
revoke all on function public.bump_like(uuid) from public;
revoke all on function public.bump_view(uuid) from public;
grant execute on function public.bump_like(uuid) to anon, authenticated;
grant execute on function public.bump_view(uuid) to anon, authenticated;


-- SETTINGS table for simple key/value app configuration
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamp with time zone default now()
);
alter table public.settings enable row level security;

-- Allow everyone (including anon) to read settings (needed for home page banner)
drop policy if exists "Read settings" on public.settings;
create policy "Read settings" on public.settings
for select to anon, authenticated
using (true);

-- Only admins can modify settings
drop policy if exists "Admins upsert settings" on public.settings;
create policy "Admins upsert settings" on public.settings
for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.id = auth.uid()));

drop policy if exists "Admins update settings" on public.settings;
create policy "Admins update settings" on public.settings
for update to authenticated
using (exists (select 1 from public.admin_users a where a.id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.id = auth.uid()));

drop policy if exists "Admins delete settings" on public.settings;
create policy "Admins delete settings" on public.settings
for delete to authenticated
using (exists (select 1 from public.admin_users a where a.id = auth.uid()));


-- === Testimonials & Contact ===
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int check (rating between 1 and 5),
  message text not null,
  approved boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  message text not null,
  created_at timestamptz default now()
);

-- RLS: everyone can read testimonials; anyone can insert testimonials/contact (demo)
alter table public.testimonials enable row level security;
alter table public.contact_messages enable row level security;

do $$ begin
  create policy "read_all_testimonials" on public.testimonials
    for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert_testimonials_any" on public.testimonials
    for insert to anon, authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "insert_contact_any" on public.contact_messages
    for insert to anon, authenticated with check (true);
exception when duplicate_object then null; end $$;
