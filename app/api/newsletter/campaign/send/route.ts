import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {Resend} from "resend";
import {NewProductsEmail} from "@/src/emails/NewProductsEmail";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_KEY = process.env.RESEND_API_KEY!;
const RESEND_FROM = process.env.RESEND_FROM || "onboarding@resend.dev";
const EMAIL_LOGO_URL =
  process.env.NEXT_PUBLIC_EMAIL_LOGO_URL ||
  "https://eouodqzlcwgnlocjfpho.supabase.co/storage/v1/object/public/product-images/logo/logo.png";

// Base site URL (örn. https://nut-things.com)
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nut-things.com").replace(/\/+$/, "");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const resend = new Resend(RESEND_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productIds: string[] = body.productIds || [];
    const subject: string = body.subject || "NuThings'de Yeni Ürünler";
    const intro: string | undefined = body.intro;

    if (!productIds.length) {
      return NextResponse.json({ok: false, message: "productIds boş olamaz"}, {status: 400});
    }

    // ✅ Önce ürünleri çek
    const {data: products, error: pErr} = await supabase
      .from("products")
      .select("id, slug, name, description, price, image_url")
      .in("id", productIds);

    if (pErr) {
      return NextResponse.json({ok: false, step: "select_products", message: pErr.message}, {status: 500});
    }

    // ✅ Sonra map et
    const mapped = (products || []).map((p: any) => ({
      id: p.id,
      title: p.name,
      desc: p.description || "",
      image: p.image_url || null,
      price: p.price,
      url: `${SITE_URL}/product/${encodeURIComponent(p.id)}`, // ID tabanlı link
    }));

    const html = NewProductsEmail({
      products: mapped,
      subject,
      intro,
      logoUrl: EMAIL_LOGO_URL,
    });

    // Aboneler
    const {data: subs, error: sErr} = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("verified", true);

    if (sErr) {
      return NextResponse.json({ok: false, step: "select_subs", message: sErr.message}, {status: 500});
    }

    let sent = 0;
    const errors: Array<{ to: string; error: string }> = [];

    for (const row of subs || []) {
      const to = (row as any).email as string;
      try {
        const resp = await resend.emails.send({
          from: RESEND_FROM,
          to,
          subject,
          html,
        });
        if ((resp as any)?.id) sent++;
      } catch (e: any) {
        errors.push({to, error: e?.message || String(e)});
      }
    }

    return NextResponse.json({ok: errors.length === 0, sent, total: (subs || []).length, errors});
  } catch (e: any) {
    return NextResponse.json({ok: false, message: e?.message || "error"}, {status: 500});
  }
}
