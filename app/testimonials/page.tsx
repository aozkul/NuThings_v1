import {supabaseServer} from "@/src/lib/supabaseServer";
import TestimonialsForm from "@/src/components/TestimonialsForm";

export const metadata = {
  title: "Kommentare | NuThings",
  description: "Kundenbewertungen und Kommentare hinterlassen",
};

export default async function TestimonialsPage() {
  const supabase = supabaseServer();
  let data: any[] | null = null;
  try {
    const res = await supabase.from("testimonials")
      .select("*")
      .eq("approved", true)
      .order("created_at", {ascending: false});
    data = res.data;
  } catch (_e) {
    data = [];
  }
  return (
    <div className="container-tight my-10">
      <h1 className="text-2xl font-semibold mb-6">Yorumlar</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 grid gap-4">
          {(data || []).map(t => (
            <article key={t.id} className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t.name}</h3>
                <div className="text-amber-500" aria-label={`Puan ${t.rating}/5`}>
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                </div>
              </div>
              <p className="mt-2 text-neutral-700">{t.message}</p>
              <div className="mt-3 text-xs text-neutral-500">{new Date(t.created_at).toLocaleDateString()}</div>
            </article>
          ))}
          {(!data || data.length === 0) && <div className="text-sm text-neutral-600">Henüz yorum yok.</div>}
        </div>
        <div>
          <TestimonialsForm/>
        </div>
      </div>
    </div>
  );
}
