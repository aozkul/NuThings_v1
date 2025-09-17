// app/reviews/page.tsx
import Link from "next/link";
import {cookies} from "next/headers";
import {supabaseServer} from "@/src/lib/supabaseServer";
import ReviewForm from "@/src/components/ReviewForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = { [key: string]: string | string[] | undefined };
const PER_PAGE = 3;

function t(ns: any, key: string, fb?: string) {
    const v = ns?.[key];
    return typeof v === "string" ? v : (fb ?? key);
}

export default async function ReviewsPage({
                                              searchParams,
                                          }: {
    searchParams?: Promise<SearchParams>;
}) {
    const sp = (await searchParams) || {};
    const page = Math.max(1, parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) || "1", 10));

    // i18n
    const jar = await cookies();
    const locale = (jar.get("lang")?.value as "de" | "tr" | "en") ?? "de";
    const messages = (await import(`../../messages/${locale}.json`)).default as any;

    // Supabase (testimonials tablosu)
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    const supabase = supabaseServer();
    const {data, count} = await supabase
        .from("testimonials")
        .select("*", {count: "exact"})
        .eq("approved", true)
        .order("created_at", {ascending: false})
        .range(from, to);

    const rows = data || [];
    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

    const PageBtn = ({
                         href,
                         disabled,
                         children,
                     }: {
        href: string;
        disabled?: boolean;
        children: React.ReactNode;
    }) => (
        <Link
            href={href}
            className={`px-3 py-1.5 rounded-md border ${
                disabled ? "opacity-50 pointer-events-none" : "hover:bg-neutral-50"
            }`}
            aria-disabled={disabled}
        >
            {children}
        </Link>
    );

    return (
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    {t(messages.common, "tüm_yorumlar", "All Reviews")}
                </h1>
                <Link href="/" className="text-sm underline">
                    {t(messages.common, "ana_sayfa", "Home")}
                </Link>
            </div>

            {/* Form EN BAŞTA */}
            <section className="rounded-2xl border p-5 bg-white/60 backdrop-blur mt-4">
                <h2 className="text-lg font-semibold mb-3">
                    {t(messages.common, "yeni_yorum_yaz", "Write a Review")}
                </h2>
                <ReviewForm/>
                <p className="mt-2 text-xs text-neutral-500">
                    * {t(
                    messages.common,
                    "aynı_tarayıcı_oturumu_çerez_için_günde_1_yorum_sınırı_vardır",
                    "One review per day per browser session."
                )}
                </p>
            </section>

            {/* Liste */}
            <div className="mt-8 space-y-3">
                {rows.length === 0 ? (
                    <div className="text-neutral-600">
                        {t(messages.common, "henüz_yorum_yok", "No reviews yet.")}
                    </div>
                ) : (
                    rows.map((r: any) => (
                        <div
                            key={r.id}
                            className="rounded-2xl border p-4 bg-white flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-2">
                                <div className="font-medium">{r.name}</div>
                                {typeof r.rating === "number" && r.rating > 0 && (
                                    <div className="ml-1 text-amber-600 text-sm">{"★".repeat(r.rating)}</div>
                                )}
                                {r.created_at && (
                                    <div className="ml-auto text-xs text-neutral-500">
                                        {new Date(r.created_at).toLocaleDateString(locale)}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-neutral-800 whitespace-pre-line">{r.message}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Sayfalama */}
            {totalPages > 1 && (
                <nav className="mt-6 flex items-center justify-center gap-2">
                    <PageBtn href={`/reviews?page=1`} disabled={page === 1}>
                        {t(messages.common, "i̇lk", "« First")}
                    </PageBtn>
                    <PageBtn href={`/reviews?page=${Math.max(1, page - 1)}`} disabled={page === 1}>
                        {t(messages.common, "önceki", "‹ Prev")}
                    </PageBtn>

                    {Array.from({length: totalPages}, (_, i) => i + 1)
                        .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                        .map((p) => (
                            <Link
                                key={p}
                                href={`/reviews?page=${p}`}
                                className={`px-3 py-1.5 rounded-md border ${
                                    p === page ? "bg-neutral-100 font-medium" : "hover:bg-neutral-50"
                                }`}
                            >
                                {p}
                            </Link>
                        ))}

                    <PageBtn href={`/reviews?page=${Math.min(totalPages, page + 1)}`} disabled={page === totalPages}>
                        {t(messages.common, "sonraki", "Next ›")}
                    </PageBtn>
                    <PageBtn href={`/reviews?page=${totalPages}`} disabled={page === totalPages}>
                        {t(messages.common, "son", "Last »")}
                    </PageBtn>
                </nav>
            )}
        </div>
    );
}
