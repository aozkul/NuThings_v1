import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Netlify/Next runtime tip uyuşmazlığını önlemek için ikinci argümanı typesız bırakıyoruz
export async function GET(req: Request, {params}: any) {
    const id = params?.id;

    if (!id) {
        return NextResponse.json({ok: false, message: "Missing id"}, {status: 400});
    }

    const {data, error} = await supabase
        .from("products")
        .select("slug")
        .eq("id", id)
        .single();

    if (error || !data?.slug) {
        return NextResponse.json({ok: false, message: "Product not found"}, {status: 404});
    }

    const target = `/products/${encodeURIComponent(data.slug)}`;
    // absolute URL ile yönlendir (Netlify/edge uyumlu)
    return NextResponse.redirect(new URL(target, req.url), 302);
}
