import type {Metadata} from "next";
import {supabaseServer} from "@/src/lib/supabaseServer";
import ProductCard from "@/src/components/ProductCard";
import FilterBar from "@/src/components/products/FilterBar";
import {cookies} from "next/headers";

export const revalidate = 60;

type Params = { slug: string };
type Search = { sort?: "name" | "price_asc" | "price_desc" | "most_liked" | "admin_order" };

// Next.js 15: params Promise
export async function generateMetadata(
  {params}: { params: Promise<Params> }
): Promise<Metadata> {
  const {slug} = await params;
  const supabase = supabaseServer();

  const bySlug = await supabase
    .from("categories")
    .select("name, seo_title, seo_desc")
    .eq("slug", slug)
    .single();

  const metaTitle = bySlug.data?.seo_title || bySlug.data?.name || "Kategorie";
  const metaDesc = bySlug.data?.seo_desc || undefined;

  return {title: metaTitle, description: metaDesc};
}

function T(messages: any, locale: "tr" | "en" | "de") {
  const t = (ns: any, key: string, fb: string) =>
    typeof ns?.[key] === "string" ? ns[key] : fb;

  return {
    title: (n?: string) =>
      n || t(messages.products_page, "title", locale === "de" ? "Produkte" : locale === "tr" ? "Ürünler" : "Products"),
    category: t(messages.common, "category", locale === "de" ? "Kategorie" : locale === "tr" ? "Kategori" : "Category"),
    sort: t(messages.common, "sort", locale === "de" ? "Sortieren" : locale === "tr" ? "Sırala" : "Sort"),
    all_categories: t(messages.common, "all_categories", locale === "de" ? "Alle Kategorien" : locale === "tr" ? "Tüm kategoriler" : "All categories"),
    sort_name: t(messages.common, "sort_name", locale === "de" ? "Name (A–Z)" : locale === "tr" ? "İsme göre" : "Name (A–Z)"),
    sort_price_asc: t(messages.common, "sort_price_asc", locale === "de" ? "Preis (aufsteigend)" : locale === "tr" ? "Fiyat (Artan)" : "Price (Low→High)"),
    sort_price_desc: t(messages.common, "sort_price_desc", locale === "de" ? "Preis (absteigend)" : locale === "tr" ? "Fiyat (Azalan)" : "Price (High→Low)"),
    sort_most_liked: t(messages.common, "sort_most_liked", locale === "de" ? "Am beliebtesten" : locale === "tr" ? "En Çok Beğenilen" : "Most Liked"),
    sort_admin: t(messages.common, "sort_admin", locale === "de" ? "Standart" : locale === "tr" ? "Varsayılan" : "Default"),
  };
}

export default async function CategoryPage(
  {params, searchParams}: { params: Promise<Params>; searchParams: Promise<Search> }
) {
  const {slug} = await params;
  const {sort: sortParam} = await searchParams;
  const sort = sortParam ?? "admin_order";
  const supabase = supabaseServer();

  // i18n
  const jar = await cookies();
  const locale = (jar.get("lang")?.value || "de") as "tr" | "en" | "de";
  let messages: any = {};
  try {
    messages =
      locale === "tr"
        ? (await import("../../messages/tr.json")).default
        : locale === "en"
          ? (await import("../../messages/en.json")).default
          : (await import("../../messages/de.json")).default;
  } catch {
  }

  const L = T(messages, locale);

  // Kategori bul
  let catId: string | null = null;
  let cat: any = null;

  const {data: bySlugCat} = await supabase
    .from("categories")
    .select("id, name, description")
    .eq("slug", slug)
    .single();

  if (bySlugCat) {
    catId = bySlugCat.id;
    cat = bySlugCat;
  } else {
    const {data: byIdCat} = await supabase
      .from("categories")
      .select("id, name, description")
      .eq("id", slug)
      .single();
    catId = byIdCat?.id ?? null;
    cat = byIdCat;
  }

  // Ürünleri getir
  let products: any[] = [];
  if (catId) {
    const {data} = await supabase
      .from("products")
      .select("id, slug, name, price, image_url, image_alt, category_id, sort_order")
      .eq("category_id", catId)
      .order(sort === "price_asc" ? "price" : sort === "price_desc" ? "price" : sort === "admin_order" ? "sort_order" : "name", {
        ascending: sort === "price_desc" ? false : true,
        nullsFirst: false
      })
      .order(sort === "admin_order" ? "name" : "name", {ascending: true});
    products = data || [];
  }

  // Sıralama
  let finalList = products;
  if (sort === "most_liked" && finalList.length) {
    const ids = finalList.map((p: any) => p.id);
    const {data: stats} = await supabase
      .from("product_stats")
      .select("product_id, likes")
      .in("product_id", ids);
    const likeMap = new Map<string, number>(
      (stats || []).map((s: any) => [String(s.product_id), Number(s.likes || 0)])
    );
    finalList = [...finalList].sort(
      (a: any, b: any) => (likeMap.get(b.id) || 0) - (likeMap.get(a.id) || 0)
    );
  }
  return (
    <div className="container-tight my-10">
      <h1 className="text-2xl font-semibold mb-2">{cat?.name || L.title()}</h1>
      {cat?.description && <p className="mb-6 text-neutral-700">{cat.description}</p>}

      {/* Kategori sayfasında da aynı SIRALAMA filtresi */}
      <div className="mb-4">
        <FilterBar
          categories={[]}               // kategori seçimi yok
          labels={{
            title: undefined,
            category: L.category,
            sort: L.sort,
            all_categories: L.all_categories,
            sort_name: L.sort_name,
            sort_price_asc: L.sort_price_asc,
            sort_price_desc: L.sort_price_desc,
            sort_most_liked: L.sort_most_liked,
            sort_admin: L.sort_admin,
          }}
          showCategory={false}          // sadece "Sırala"
          selectedSort={sort}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {finalList.map((p: any) => (
          <ProductCard key={p.id} p={p}/>
        ))}
      </div>
    </div>
  );
}
