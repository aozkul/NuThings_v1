export const runtime = "edge";            // Geo bilgisini kullanmak için Edge runtime
export const dynamic = "force-dynamic";   // ISR/Cache kapatma ihtimali: her isteği işle

import {NextRequest, NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

// Supabase client (Edge'te fetch ile uyumlu çalışır)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, anon);

function getHeader(req: NextRequest, name: string) {
  return req.headers.get(name) ?? undefined;
}

function pickCountry(req: NextRequest) {
  // 0) Edge geo (Vercel) — Edge runtime'da mevcut
  const geoCountry = (req as any)?.geo?.country;
  if (geoCountry && geoCountry.length <= 3) return geoCountry.toUpperCase();

  // 1) Yaygın edge/proxy header’ları (Vercel/Cloudflare)
  const keys = ["x-vercel-ip-country", "cf-ipcountry", "x-country", "x-geo-country", "x-edge-country"];
  for (const k of keys) {
    const v = getHeader(req, k);
    if (v && v.length <= 4) return v.toUpperCase();
  }

  // 2) Zayıf fallback: Accept-Language (ör. tr-TR -> TR)
  const al = getHeader(req, "accept-language");
  if (al) {
    const m = /[a-z]{2}-([A-Z]{2})/i.exec(al);
    if (m) return m[1].toUpperCase();
  }

  return "ZZ"; // bilinmiyor
}

function hashIp(ip: string) {
  // basit FNV-1a benzeri hash – tekil ziyaretçi tahmini için
  let h = 2166136261 >>> 0;
  for (let i = 0; i < ip.length; i++) {
    h ^= ip.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = (body?.path || "/").toString().slice(0, 500);
    const referrer = (getHeader(req, "referer") || "").slice(0, 500);
    const ua = (getHeader(req, "user-agent") || "").slice(0, 500);

    // Proxy'lerden gerçek IP'yi al (ilk değer)
    const xff = getHeader(req, "x-forwarded-for") || "";
    const ip = (xff.split(",")[0] || "").trim() || "0.0.0.0";
    const ip_hash = hashIp(ip);

    const country = pickCountry(req);

    const {error} = await supabase.from("analytics_visits").insert({
      path,
      referrer,
      user_agent: ua,
      ip_hash,
      country,
    });

    if (error) {
      return NextResponse.json({ok: false, error: error.message}, {status: 500});
    }
    return NextResponse.json({ok: true});
  } catch (e: any) {
    return NextResponse.json({ok: false, error: e?.message || "unknown"}, {status: 500});
  }
}
