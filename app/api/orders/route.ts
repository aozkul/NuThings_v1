import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

type Item = { product_id: string; quantity: number };

export async function POST(req: Request) {
  try {
    const { items, email }: { items: Item[]; email?: string } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "INVALID_ITEMS" }, { status: 400 });
    }

    // sanitize
    const clean = items
      .map(i => ({ product_id: String(i.product_id), quantity: Math.max(1, Number(i.quantity) || 0) }))
      .filter(i => i.product_id && i.quantity > 0);

    if (clean.length === 0) {
      return NextResponse.json({ error: "INVALID_ITEMS" }, { status: 400 });
    }

    const sb = supabaseServer();

    // Call RPC that inserts order, items and decrements stock atomically in a transaction
    const { data, error } = await sb.rpc("create_order_with_stock", {
      p_buyer_email: email || null,
      p_items: clean
    });

    if (error) {
      const msg = (error as any)?.message || "UNKNOWN";
      const status = /stock|OUT_OF_STOCK|insufficient/i.test(msg) ? 409 : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    const order_id = Array.isArray(data) && (data as any)[0]?.order_id ? (data as any)[0].order_id : null;
    return NextResponse.json({ ok: true, order_id });
  } catch (e: any) {
    return NextResponse.json({ error: "SERVER_ERROR", detail: e?.message || String(e) }, { status: 500 });
  }
}
