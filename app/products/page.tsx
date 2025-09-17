import {supabaseServer} from "@/src/lib/supabaseServer";
import ProductCard from "@/src/components/ProductCard";
import FilterBar from "@/src/components/products/FilterBar";
import {cookies} from "next/headers";

export const revalidate = 60;

type Search = {
  category_id?: string;
  sort?: "name" | "price_asc" | "price_desc" | "most_liked";
};

function t(ns: any, key: string, fb?: string) {
  const v = ns?.[key];
  return typeof v === "string" ? v : (fb ?? key);
}

export default async function ProductsPage({
                                             searchParams,
                                           }: {
  searchParams: Promise<Search>;
}) {
  const {category_id, sort = "most_liked"} = await searchParams;
  const supabase = supabaseServer();

  // Dil & mesajlar
  const jar = await cookies();
  const locale = (jar.get("lang")?.value || "de") as "tr" | "en" | "de";
  let messages: any = {};
  try {
    messages =
      locale === "tr"
        ? (await import("../messages/tr.json")).default
        : locale === "en"
          ? (await import("../messages/en.json")).default
          : (await import("../messages/de.json")).default;
  } catch {
  }

  // Tüm label'ları server'da hazırla (garanti locale)
  const L = {
    title: t(
      messages.products_page,
      "title",
      locale === "de" ? "Produkte" : locale === "tr" ? "Ürünler" : "Products"
    ),
    category:
      t(messages.common, "category") ||
      (locale === "de" ? "Kategorie" : locale === "tr" ? "Kategori" : "Category"),
    sort:
      t(messages.common, "sort") ||
      (locale === "de" ? "Sortieren" : locale === "tr" ? "Sırala" : "Sort"),
    all_categories:
      t(messages.common, "all_categories") ||
      (locale === "de"
        ? "Alle Kategorien"
        : locale === "tr"
          ? "Tüm kategoriler"
          : "All categories"),
    sort_name:
      t(messages.common, "sort_name") ||
      (locale === "de" ? "Name (A–Z)" : locale === "tr" ? "İsme göre" : "Name (A–Z)"),
    sort_price_asc:
      t(messages.common, "sort_price_asc") ||
      (locale === "de"
        ? "Preis (aufsteigend)"
        : locale === "tr"
          ? "Fiyat (Artan)"
          : "Price (Low→High)"),
    sort_price_desc:
      t(messages.common, "sort_price_desc") ||
      (locale === "de"
        ? "Preis (absteigend)"
        : locale === "tr"
          ? "Fiyat (Azalan)"
          : "Price (High→Low)"),
    sort_most_liked:
      t(messages.common, "sort_most_liked") ||
      (locale === "de"
        ? "Am beliebtesten"
        : locale === "tr"
          ? "En Çok Beğenilen"
          : "Most Liked"),
  };

  // Kategoriler
  const {data: categories} = await supabase
    .from("categories")
    .select("id, name")
    .order("name", {ascending: true});

  // Ürünler
  let query = supabase
    .from("products")
    .select("id, slug, name, price, image_url, image_alt, category_id")
    .order("name", {ascending: true});

  if (category_id) query = query.eq("category_id", category_id);

  const {data: products} = await query;

  // Sıralama
  let finalList = products || [];
  if (sort === "price_asc") {
    finalList = [...finalList].sort(
      (a: any, b: any) => Number(a.price) - Number(b.price)
    );
  } else if (sort === "price_desc") {
    finalList = [...finalList].sort(
      (a: any, b: any) => Number(b.price) - Number(a.price)
    );
  } else if (sort === "most_liked" && finalList.length) {
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
  } else {
    finalList = [...finalList].sort((a: any, b: any) =>
      String(a.name).localeCompare(String(b.name))
    );
  }

  return (
    <div className="container-tight my-10">
      <h1 className="text-2xl font-semibold mb-4">{L.title}</h1>
      <FilterBar
        categories={(categories || []) as any}
        labels={L}
        showCategory={true}
        selectedCategoryId={category_id ?? ""}
        selectedSort={sort}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {finalList.map((p: any) => (
          <ProductCard key={p.id} p={p}/>
        ))}
      </div>
    </div>
  );
}
