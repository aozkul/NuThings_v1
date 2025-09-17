-- Eğer products tablosunda 'slug' kolonu yoksa eklemek için:
alter table public.products add column if not exists slug text;
create index if not exists products_slug_idx on public.products(slug);
