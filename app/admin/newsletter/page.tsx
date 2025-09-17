import {cookies} from "next/headers";
import {createClient} from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function NewsletterAdmin() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const {data, error} = await supabase
        .from("newsletter_subscribers")
        .select("email, locale, consent_at, verified")
        .order("consent_at", {ascending: false});

    if (error) return <div className="p-6 text-red-600">Hata: {error.message}</div>;

    const csv = [
        ["email", "locale", "consent_at", "verified"].join(","),
        ...(data || []).map(r => [r.email, r.locale, r.consent_at, r.verified ? "true" : "false"].join(","))
    ].join("\n");

    return (
        <div className="p-6">\n      <a href="/admin" className="inline-block mb-4 text-sm text-blue-600 hover:underline">⬅ Admin Paneline Dön</a>
            <h1 className="text-xl font-semibold mb-4">Newsletter Aboneleri</h1>
            <a className="text-sm underline" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
               download="newsletter.csv">
                CSV indir
            </a>
            <table className="mt-3 w-full text-sm">
                <thead>
                <tr className="text-left border-b">
                    <th className="py-2">Email</th>
                    <th>Locale</th>
                    <th>Onay Zamanı</th>
                    <th>Doğrulandı</th>
                </tr>
                </thead>
                <tbody>
                {(data || []).map((r, i) => (
                    <tr key={i} className="border-b">
                        <td className="py-2">{r.email}</td>
                        <td>{r.locale}</td>
                        <td>{new Date(r.consent_at).toLocaleString()}</td>
                        <td>{r.verified ? "✓" : "-"}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
