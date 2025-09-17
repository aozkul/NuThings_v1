-- Adds rich text 'important_html' field to products
alter table public.products
add column if not exists important_html text null;

comment on column public.products.important_html is 'Rich-text HTML shown under product description as Önemli Bilgi.';
