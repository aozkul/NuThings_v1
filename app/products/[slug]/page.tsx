// app/products/[slug]/page.tsx
import React from "react";
import type {Metadata} from "next";
import Link from "next/link";
import {cookies} from "next/headers";
import {supabaseServer} from "@/src/lib/supabaseServer";
import type {Product, Category} from "@/src/lib/types";

import ProductGalleryLoader from "@/src/components/ProductGalleryLoader";
import LikeButton from "@/src/components/LikeButton";
import TrackView from "@/src/components/TrackView";
import ShareMenu from "@/src/components/ShareMenu";
import RelatedCarousel from "@/src/components/product/RelatedCarousel";
import BuyBox from "@/src/components/product/BuyBox";

/** ─────────── SEO ─────────── */
export async function generateMetadata(
  {params}: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const {slug} = await params;
  const supabase = await supabaseServer();

  const {data: bySlug} = await supabase.from("products").select("*, stock").eq("slug", slug).single();
  const fallback = bySlug ? null : await supabase.from("products").select("*").eq("id", slug).single();
  const data: any = (bySlug as Product) || (fallback?.data as Product) || null;

  const title = (data?.seo_title as string) || (data?.name ? `${data.name} | NuThings` : "Ürün | NuThings");
  const description =
    (data?.seo_desc as string) || (data?.description as string) || "Premium kuruyemiş ve geleneksel lezzetler.";
  const image = (data?.image_url as string) || "/og-default.png";

  return {
    title,
    description,
    openGraph: {title, description, images: [image], type: "website"},
    alternates: {canonical: `/products/${slug}`},
  };
}

/** ─────────── Page ─────────── */
export default async function ProductPage(
  {params}: { params: Promise<{ slug: string }> }
) {
  const {slug} = await params;
  const supabase = await supabaseServer();

  // i18n (cookie -> messages)
  const jar = await cookies();
  const locale = (jar.get("lang")?.value as "de" | "tr" | "en") ?? "de";
  const messages = await (async () => {
    switch (locale) {
      case "tr":
        return (await import("../../messages/tr.json")).default as any;
      case "en":
        return (await import("../../messages/en.json")).default as any;
      default:
        return (await import("../../messages/de.json")).default as any;
    }
  })();

  const T = (key: string, fb?: string) => {
    try {
      const parts = key.split(".");
      let cur: any = messages;
      for (const p of parts) cur = cur?.[p];
      return (cur as string) ?? fb ?? key;
    } catch {
      return fb ?? key;
    }
  };

  // labels
  const L_HOME = T("common.home", "Home");
  const L_IMPORTANT = T("product.important_info", "Wichtige Information");
  const L_SHARE = T("product.share", "Teilen");
  const L_STOCK_STATUS = T("product.stock_status", "Lagerstatus");
  const L_STOCK_IN = T("product.stock_in", "Auf Lager");
  const L_STOCK_LOW = T("product.stock_low", "Niedriger Bestand");
  const L_STOCK_OUT = T("product.stock_out", "Ausverkauft");
  const L_CATEGORY = T("product.category", "Kategorie");
  const L_SKU = T("product.sku", "Artikelnummer");

  // Product
  const {data: bySlug} = await supabase.from("products").select("*").eq("slug", slug).single();
  const fallback = bySlug ? null : await supabase.from("products").select("*").eq("id", slug).single();
  const product: any = (bySlug as Product) || (fallback?.data as Product) || null;

  if (!product) {
    return (
      <div className="container-tight my-10">
        <h1 className="text-xl font-semibold">Ürün bulunamadı</h1>
        <p className="text-neutral-600 mt-2">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
        <div className="mt-6">
          <Link href="/" className="text-primary underline underline-offset-2">Anasayfa</Link>
        </div>
      </div>
    );
  }

  // Category (breadcrumb)
  let category: Pick<Category, "id" | "name" | "slug"> | null = null;
  if (product.category_id) {
    const {data: c} = await supabase
      .from("categories")
      .select("id,name,slug")
      .eq("id", product.category_id)
      .single();
    category = (c as any) || null;
  }

  // Likes
  const initialLikes = typeof product.likes === "number" ? product.likes : 0;

  // Stock badge
  const stockCount = Number((product as any)?.stock ?? 1);
  const stockState = stockCount <= 0 ? "out" : stockCount <= 5 ? "low" : "in";
  const stockLabel = stockState === "out" ? L_STOCK_OUT : stockState === "low" ? L_STOCK_LOW : L_STOCK_IN;
  const stockClass =
    stockState === "out"
      ? "bg-red-100 text-red-700 ring-red-200"
      : stockState === "low"
        ? "bg-amber-100 text-amber-700 ring-amber-200"
        : "bg-emerald-100 text-emerald-700 ring-emerald-200";

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.seo_desc || product.description || undefined,
    image: product.image_url ? [product.image_url] : undefined,
    brand: {"@type": "Brand", name: "NuThings"},
    sku: product.id,
    url: `https://nut-things.com/products/${product.slug || slug}`,
    offers: product.price
      ? {
        "@type": "Offer",
        priceCurrency: "EUR",
        price: String(product.price),
        availability: "https://schema.org/InStock",
        url: `https://nut-things.com/products/${product.slug || slug}`,
      }
      : undefined,
    aggregateRating:
      typeof initialLikes === "number" && initialLikes > 0
        ? {"@type": "AggregateRating", ratingValue: "5", reviewCount: String(initialLikes)}
        : undefined,
  } as const;

  return (
    <div className="pb-16">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />

      {/* Breadcrumbs */}
      <nav className="container-tight mt-5 text-sm text-neutral-600" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">{L_HOME}</Link>
          </li>
          <li className="opacity-60">/</li>
          {category ? (
            <>
              <li>
                <Link href={`/category/${category.slug || category.id}`} className="hover:underline">
                  {category.name}
                </Link>
              </li>
              <li className="opacity-60">/</li>
            </>
          ) : null}
          <li className="text-neutral-900" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      {/* Main grid */}
      <div className="container-tight mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: gallery */}
        <div className="lg:col-span-6">
          <ProductGalleryLoader
            productId={product.id}
            mainUrl={product.image_url}
            mainAlt={product.image_alt || product.name}
          />
        </div>

        {/* Right: content */}
        <aside className="lg:col-span-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{product.name}</h1>

          {/* Price */}
          {typeof product.price !== "undefined" && product.price !== null && (
            <div className="mt-3 text-3xl font-bold leading-none">
              {product.price}
              <span className="text-base font-normal text-neutral-600"> €</span>
            </div>
          )}

          <BuyBox
            productId={product.id}
            stock={product.stock}
            price={product.price}
            title={product.name}
            imageUrl={product.image_url}
          />

          {/* Cart meta (ek garanti) */}
          <script type="application/json" data-product-json>
            {JSON.stringify({
              title: product.name,
              slug: product.slug || slug,
              imageUrl: product.image_url,
              price: product.price,
            })}
          </script>

          {/* Short description */}
          {product.description && (
            <p className="mt-4 text-neutral-700 leading-relaxed whitespace-pre-line">{product.description}</p>
          )}

          {/* Important info (rich HTML) */}
          {product.important_html && (
            <details className="mt-5 rounded-2xl border border-amber-300 bg-amber-50/60 p-4 open:shadow-sm">
              <summary className="cursor-pointer select-none font-medium text-amber-900">{L_IMPORTANT}</summary>
              {/* eslint-disable-next-line react/no-danger */}
              <div
                className="prose prose-sm mt-3 max-w-none [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal"
                dangerouslySetInnerHTML={{__html: product.important_html as string}}
              />
            </details>
          )}

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LikeButton productId={product.id} initialLikes={initialLikes}/>
            <ShareMenu
              url={`/products/${product.slug || slug}`}
              productTitle={product.name}
              label={L_SHARE}
              mode="native"
            />
          </div>

          {/* Meta */}
          <ul className="mt-6 space-y-2 text-sm text-neutral-600">
            <li>
              <span className="inline-block w-28 text-neutral-500">{L_STOCK_STATUS}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${stockClass}`}>
                {stockLabel}
              </span>
            </li>
            {category && (
              <li>
                <span className="inline-block w-28 text-neutral-500">{L_CATEGORY}</span>
                <Link href={`/category/${category.slug || category.id}`} className="underline underline-offset-2">
                  {category.name}
                </Link>
              </li>
            )}
            <li>
              <span className="inline-block w-28 text-neutral-500">{L_SKU}</span>
              <span>{product.id}</span>
            </li>
          </ul>
        </aside>
      </div>

      {/* Related */}
      <div className="mt-12 container-tight">
        <RelatedCarousel seedSlug={product.slug ?? slug}/>
      </div>

      {/* View tracking */}
      <TrackView id={product.id} slug={product.slug || slug}/>
    </div>
  );
}
