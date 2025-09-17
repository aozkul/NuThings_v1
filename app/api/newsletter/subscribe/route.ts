import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const runtime = "nodejs"; // Edge değil, Node olsun (env için güvenli)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServerClient() {
    if (!SUPABASE_URL || !SERVICE_KEY) {
        // Dev sırasında daha okunur hata dönelim
        throw new Error("Missing Supabase envs. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
    return createClient(SUPABASE_URL, SERVICE_KEY, {auth: {persistSession: false}});
}

export async function POST(req: Request) {
    try {
        const {email, locale}: { email?: string; locale?: string } = await req.json();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ok: false, message: "invalid_email"}, {status: 400});
        }

        const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0];
        const ua = req.headers.get("user-agent") || "";

        const supabase = getServerClient();

        const {error} = await supabase
            .from("newsletter_subscribers")
            .upsert(
                {email: email.toLowerCase(), locale: locale || "de", consent: true, ip, user_agent: ua},
                {onConflict: "email"}
            );

        if (error) throw error;
        return NextResponse.json({ok: true});
    } catch (e: any) {
        console.error("newsletter subscribe error:", e);
        return NextResponse.json({ok: false, message: e?.message || "error"}, {status: 500});
    }
}
