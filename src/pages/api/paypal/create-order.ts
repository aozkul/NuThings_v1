import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, getPaypalBase, requireJson } from "@/src/lib/paypal";

type Body = { amount: string; currency?: string; reference_id?: string; };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireJson(req);
    const { amount, currency = "EUR", reference_id = "default" } = (req.body || {}) as Body;
    if (!amount) return res.status(400).json({ error: "amount_required" });

    const access = await getAccessToken();
    const resp = await fetch(`${getPaypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id,
            amount: { currency_code: currency, value: String(amount) },
          },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(500).json({ error: "create_order_failed", details: data });
    }
    return res.status(200).json({ id: data.id, status: data.status, data });
  } catch (e: any) {
    console.error("[paypal] create-order error:", e);
    return res.status(500).json({ error: "server_error", message: e?.message || String(e) });
  }
}
