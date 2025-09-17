// app/api/testimonials/route.ts
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {supabaseServer} from "@/src/lib/supabaseServer";

const TABLE = "testimonials";
export const runtime = "nodejs";

// GET /api/testimonials?limit=12
export async function GET(req: Request) {
    const {searchParams} = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 12);

    const sb = supabaseServer();
    const {data, error} = await sb
        .from(TABLE)
        .select("id, name, rating, message, approved, created_at")
        .eq("approved", true) // sadece onaylı
        .order("created_at", {ascending: false})
        .limit(Math.min(Math.max(limit, 1), 100));

    if (error) return NextResponse.json({error: error.message}, {status: 500});
    return NextResponse.json(data ?? []);
}

// POST /api/testimonials
// Body: { name, rating?, message }
export async function POST(req: Request) {
    const body = await req.json().catch(() => null) as
        | { name?: string; rating?: number | null; message?: string }
        | null;

    if (!body?.name || !body?.message) {
        return NextResponse.json({error: "Missing fields"}, {status: 400});
    }

    // basit rate-limit: 1/gün
    const jar = await cookies();
    const key = "tmnls_today";
    if (jar.get(key)?.value === "1") {
        return NextResponse.json({error: "rate_limited"}, {status: 429});
    }

    const sb = supabaseServer();
    const {data, error} = await sb
        .from(TABLE)
        .insert({
            name: body.name,
            rating: body.rating ?? null,
            message: body.message,
            // approved: true  // şemada default true; gerekirse burada override edebilirsiniz
        })
        .select("id, name, rating, message, approved, created_at")
        .single();

    if (error) return NextResponse.json({error: error.message}, {status: 500});

    // 24 saatlik cookie
    jar.set({name: key, value: "1", path: "/", httpOnly: false, maxAge: 60 * 60 * 24});

    return NextResponse.json(data, {status: 201});
}
