-- 2025-09-12: product_images extras
alter table public.product_images
  add column if not exists position int default 0,
  add column if not exists image_alt text;

-- backfill positions
with ranked as (
  select id, product_id, row_number() over (partition by product_id order by created_at) - 1 as rn
  from public.product_images
)
update public.product_images pi
set position = ranked.rn
from ranked
where ranked.id = pi.id and (pi.position is null or pi.position = 0);

-- refresh PostgREST
notify pgrst, 'reload schema';
