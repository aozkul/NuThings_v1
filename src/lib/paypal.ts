import type { NextApiRequest } from "next";

const env = process.env.PAYPAL_ENV?.toLowerCase() === "live" ? "live" : "sandbox";
const PAYPAL_BASE = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn("[paypal] Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET");
}

export function getPaypalBase() {
  return PAYPAL_BASE;
}

export async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[paypal] oauth token failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export function requireJson(req: NextApiRequest) {
  if (req.method !== "POST") throw new Error("Method not allowed");
}
