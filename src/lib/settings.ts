import { supabaseServer } from "@/src/lib/supabaseServer";

export type SettingsMap = Record<string, string>;

export async function getSettings(keys: string[]): Promise<SettingsMap> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("settings").select("key,value").in("key", keys);
  if (error) return {};
  const map: SettingsMap = {};
  for (const r of data || []) map[r.key] = (r.value || "").trim();
  return map;
}

export const LEGAL_KEYS = [
  "legal_company_name",
  "legal_address_street",
  "legal_address_zipcity",
  "legal_contact_phone",
  "legal_contact_email",
  "legal_register",
  "legal_vat_id",
  "legal_content_responsible",
  "privacy_controller_name",
  "privacy_controller_address",
  "privacy_controller_email",
  "shipping_area",
  "shipping_time",
  "shipping_costs",
  "payment_methods",
  "withdrawal_company",
  "withdrawal_address",
  "withdrawal_email",
];
