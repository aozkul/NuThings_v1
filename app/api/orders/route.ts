import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

type Item = { product_id: string; quantity: number };

export async function POST(req: Request) {
  try {
    const { items, email }: { items: Item[]; email?: string } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "INVALID_ITEMS" }, { status: 400 });
    }

    const clean = items
      .map(i => ({ product_id: String(i.product_id), quantity: Number(i.quantity) }))
      .filter(i => i.product_id && Number.isFinite(i.quantity) && i.quantity > 0);

    if (clean.length === 0) {
      return NextResponse.json({ error: "INVALID_ITEMS" }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data, error } = await supabase.rpc("place_order", {
      items: JSON.stringify(clean),
      buyer_email: email ?? null,
    });

    if (error) {
      const msg = (error as any)?.message || "UNKNOWN";
      const status = msg.includes("OUT_OF_STOCK") ? 409 : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    const order_id = Array.isArray(data) && (data as any)[0]?.order_id ? (data as any)[0].order_id : null;
    return NextResponse.json({ ok: true, order_id });
  } catch (e: any) {
    return NextResponse.json({ error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
