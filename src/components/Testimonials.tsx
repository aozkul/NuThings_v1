// src/components/Testimonials.tsx
import Link from "next/link";
import {supabaseServer} from "@/src/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TestimonialsSection() {
  const supabase = supabaseServer();

  // SON 3 yorumu çek
  const {data, error} = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", {ascending: false})
    .limit(3);

  const rows = data || [];

  return (
    <section className="container-tight my-12 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Yorumlar</h2>
        <Link href="/reviews" className="text-sm underline">
          Tüm yorumlar ve yorum gir
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border p-4 text-red-600">
          Yorumlar yüklenemedi: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border p-4 text-neutral-600">
          Henüz yorum girilmemiş.{" "}
          <Link href="/reviews" className="underline">
            İlk yorumu yaz
          </Link>
          .
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((t: any) => (
            <article
              key={t.id}
              className="rounded-2xl border p-4 bg-white/60 backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{t.name || "Anonim"}</div>
                {t.created_at && (
                  <time
                    dateTime={t.created_at}
                    className="text-xs text-neutral-500"
                  >
                    {new Date(t.created_at).toLocaleDateString()}
                  </time>
                )}
              </div>
              {typeof t.rating === "number" && (
                <div className="mt-1 text-amber-600">
                  {"★".repeat(Math.max(0, Math.min(5, t.rating)))}
                  <span className="ml-1 text-neutral-500">({t.rating}/5)</span>
                </div>
              )}
              <p className="mt-2 leading-relaxed whitespace-pre-wrap">
                {t.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
