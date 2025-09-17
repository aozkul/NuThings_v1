import type { Metadata } from "next";
import { supabaseServer } from "@/src/lib/supabaseServer";
import ProductCard from "@/src/components/ProductCard";

export const revalidate = 60;

type Params = { slug: string };

// Next.js 15: params Promise olarak gelir -> await et!
export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = supabaseServer();

  // Önce slug ile deneriz, yoksa eski linkler kırılmasın diye id fallback
  const { data: catBySlug } = await supabase
    .from("categories")
    .select("id,name,seo_title,seo_desc,tagline,description,slug")
    .eq("slug", slug)
    .single();

  let cat = catBySlug;
  if (!cat) {
    const { data: catById } = await supabase
      .from("categories")
      .select("id,name,seo_title,seo_desc,tagline,description,slug")
      .eq("id", slug)
      .single();
    cat = catById || null;
  }

  const title = cat?.seo_title || cat?.name || "Kategori";
  const description = cat?.seo_desc || cat?.tagline || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: cat?.slug ? `/category/${cat.slug}` : undefined,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const supabase = supabaseServer();

  // Kategoriyi slug ile bul, yoksa id fallback
  const { data: catBySlug } = await supabase
    .from("categories")
    .select("id,name,description,slug")
    .eq("slug", slug)
    .single();

  let cat = catBySlug;
  if (!cat) {
    const { data: catById } = await supabase
      .from("categories")
      .select("id,name,description,slug")
      .eq("id", slug)
      .single();
    cat = catById || null;
  }

  if (!cat) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Kategori bulunamadı</h1>
        <p className="text-neutral-600">Aradığınız kategori mevcut değil.</p>
      </div>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", cat.id)
    .order("sort_order", { ascending: true }).order("name", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">{cat?.name || "Kategori"}</h1>

      {cat?.description && (
        <p className="mb-6 text-neutral-700">{cat.description}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(products || []).map((p: any) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
