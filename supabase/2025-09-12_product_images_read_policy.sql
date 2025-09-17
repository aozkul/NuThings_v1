-- 2025-09-12: read policy for product_images
alter table public.product_images enable row level security;

do $$
begin
  create policy if not exists "read_all_product_images"
    on public.product_images
    for select
    to anon, authenticated
    using (true);
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
