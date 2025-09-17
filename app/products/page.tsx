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

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { category_id, sort = "most_liked" } = await searchParams;
  const supabase = supabaseServer();

  // i18n (server-side): read cookie and pick json
  const jar = await cookies();
  const locale = (jar.get("lang")?.value || "de") as "tr"|"en"|"de";
  let messages: any = {};
  try {
    if (locale === "tr") {
      messages = (await import("../messages/tr.json")).default;
    } else if (locale === "en") {
      messages = (await import("../messages/en.json")).default;
    } else {
      messages = (await import("../messages/de.json")).default;
    }
  } catch {}

  // categories
  const {data: categories} = await supabase
    .from("categories")
    .select("id, name")
    .order("name", {ascending: true});

  // products base query
  let query = supabase
    .from("products")
    .select("id, slug, name, price, image_url, image_alt, category_id")
    .order("name", {ascending: true});

  // filter by category if present
  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  // fetch products
  const {data: products} = await query;

  // sorting
  let finalList = products || [];
  if (sort === "price_asc") {
    finalList = [...finalList].sort((a:any,b:any) => Number(a.price) - Number(b.price));
  } else if (sort === "price_desc") {
    finalList = [...finalList].sort((a:any,b:any) => Number(b.price) - Number(a.price));
  } else if (sort === "most_liked" && finalList.length) {
    const ids = finalList.map((p:any) => p.id);
    const {data: stats} = await supabase
      .from("product_stats")
      .select("product_id, likes")
      .in("product_id", ids);
    const likeMap = new Map<string, number>((stats || []).map((s:any) => [String(s.product_id), Number(s.likes || 0)]));
    finalList = [...finalList].sort((a:any,b:any) => (likeMap.get(b.id) || 0) - (likeMap.get(a.id) || 0));
  } else {
    // default name
    finalList = [...finalList].sort((a:any,b:any) => String(a.name).localeCompare(String(b.name)));
  }

  return (
    <div className="container-tight my-10">
      <h1 className="text-2xl font-semibold mb-4">{t(messages.products_page, "title", "Products")}</h1>
      <FilterBar categories={(categories || []) as any} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {finalList.map((p: any) => (<ProductCard key={p.id} p={p}/>))}
      </div>
    </div>
  );
}
