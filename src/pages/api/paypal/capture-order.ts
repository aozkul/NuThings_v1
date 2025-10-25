import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, getPaypalBase, requireJson } from "@/src/lib/paypal";

type Body = { orderID: string };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    requireJson(req);
    const { orderID } = (req.body || {}) as Body;
    if (!orderID) return res.status(400).json({ error: "order_id_required" });

    const access = await getAccessToken();
    const resp = await fetch(`${getPaypalBase()}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access}`,
        "Content-Type": "application/json",
      },
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(500).json({ error: "capture_failed", details: data });
    }
    return res.status(200).json({ status: data.status, data });
  } catch (e: any) {
    console.error("[paypal] capture-order error:", e);
    return res.status(500).json({ error: "server_error", message: e?.message || String(e) });
  }
}
