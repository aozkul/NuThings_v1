# Nut Things — Next 15 (SSR, SEO-safe, Supabase)

Bu proje, yüklediğin Astro projenin **özelliklerini Next 15** ile SSR/SSG tabanlı olarak yeniden uygular:
- Ana sayfa: **Ana Ürünler slider** (categories), Öne Çıkanlar (products.is_featured), Parallax yazılar (settings)
- Ürünler sayfası: `?category_id=<uuid>` ile filtre
- Admin: Supabase Auth (password/magic-link), **Ayarlar / Ürünler / Metrics** sekmeleri
- Tam SEO: `metadata`, `robots.ts`, `sitemap.ts` (SSR)
- Supabase şema: `supabase/schema.sql` (yüklediğin projeden kopyalandı)

## Kurulum
```bash
npm i
cp .env.example .env.local
# .env.local içine:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
npm run dev
```

## Notlar
- Görseller için `next/image` yerine `<img>` kullanıldı; domain whitelisting gerekmeden hemen çalışır.
- İleride istersen `next/image`'a geçiririz (LCP için daha iyi). O zaman `next.config.js` içine Supabase domain'i eklenmeli.
- Admin > Metrics sekmesi `rpc(get_metrics)` varsa doldurur, yoksa boş kalabilir. Ekleriz.
- Eski projedeki ekstra stilleri birebir taşımak istersen, CSS/WIP taleplerini yaz, birlikte ince ayar yapalım.


## Analytics
- Run the SQL in `supabase/migrations/2025-10-10_analytics_visits.sql` in Supabase.
- Deploy. The site will POST to `/api/analytics/visit` on first view per path per session.
- Admin → Analitik sekmesinden grafiklere bakabilirsiniz.
