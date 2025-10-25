
"use client";

import {useMemo, useState, useCallback} from "react";
import { useI18n } from "@/src/i18n/provider";
import {useCart} from "@/src/components/cart/CartContext";
import CheckoutPayPal from "@/src/components/payment/CheckoutPayPal";

export const dynamic = "force-dynamic";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  accept: boolean;
};

const initialForm: Form = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  city: "",
  zip: "",
  country: "DE",
  accept: true,
};

export default function CheckoutPage() {
  const { t } = useI18n();
  // Local DE fallback in case messages don't include `checkout` namespace
  const deFallback: Record<string,string> = {
    thanks: "Danke! 🎉",
    order_received: "Ihre Bestellung wurde erfolgreich aufgenommen. Der Bestand wurde aktualisiert.",
    order_no: "Bestell-Nr:",
    payment: "Zahlung",
    complete_below: "Schließen Sie Ihre Bestellung unten ab.",
    cart_empty: "Ihr Warenkorb ist leer.",
    billing_shipping: "Rechnung & Lieferung",
    first_name: "Vorname",
    last_name: "Nachname",
    email: "E‑Mail",
    address: "Adresse",
    city: "Stadt",
    zip: "PLZ",
    country: "Land",
    accept_terms_html: "Ich akzeptiere die Fernabsatzbedingungen und die <a class=\"underline\" href=\"/agb\" target=\"_blank\">AGB</a>.",
    order_summary: "Bestellübersicht",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    at_checkout: "An der Kasse",
    grand_total: "Gesamtsumme",
    paypal_secure: "Sicher mit PayPal bezahlen.",
    place_order_test: "Ohne Zahlung bestellen (Test)",
    processing: "Wird verarbeitet...",
    fill_form_first: "Bitte Formular ausfüllen",
    stock_note: "Nach Bestätigung werden die Bestände automatisch reduziert.",
    remove: "Entfernen",
    no_image: "Kein Bild"
  };
  const tt = (k: string) => {
    const v = t('checkout', k);
    return v === k ? (deFallback[k] ?? k) : v;
  };

  const { items, total, updateQty, remove, clear } = useCart() as any;
  const [form, setForm] = useState<Form>(initialForm);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{order_id?: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasItems = (items && items.length > 0);
  const totalStr = useMemo(() => (Math.max(0, Number(total || 0))).toFixed(2), [total]);

  const onChange = (k: keyof Form, v: any) => setForm(s => ({ ...s, [k]: v }));
  const valid = useMemo(() => {
    if (!hasItems) return false;
    if (!form.firstName || !form.lastName) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false;
    if (!form.address || !form.city || !form.zip) return false;
    if (!form.accept) return false;
    return true;
  }, [form, hasItems]);

  const placeOrder = useCallback(async () => {
    setPlacing(true);
    setError(null);
    try {
      const payload = {
        email: form.email,
        items: (items || []).map((i: any) => ({ product_id: i.id, quantity: i.quantity })),
      };
      const resp = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || "ORDER_FAILED");
      }
      setDone({ order_id: data.order_id });
      clear();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setPlacing(false);
    }
  }, [items, form.email, clear]);

  const handleApprove = async (_paypalOrderId: string) => {
    // After successful PayPal capture, we place the order in DB (this will also decrement stock atomically via RPC)
    await placeOrder();
  };

  if (!hasItems && done) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">{tt('thanks')}</h1>
        <p className="text-neutral-600">{tt('order_received')}</p>
        {done?.order_id && <p className="mt-2 text-sm text-neutral-500">Sipariş No: <span className="font-mono">{done.order_id}</span></p>}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">{tt('payment')}</h1>
      <p className="text-neutral-600 mb-6">{tt('complete_below')}</p>

      {!hasItems ? (
        <div className="rounded-lg border p-6 text-neutral-600">{tt('cart_empty')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Address / Billing */}
          <section className="lg:col-span-3 rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold text-lg">{tt('billing_shipping')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1">{tt('first_name')}</label>
                <input className="w-full border rounded-md h-10 px-3" value={form.firstName} onChange={e => onChange("firstName", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">{tt('last_name')}</label>
                <input className="w-full border rounded-md h-10 px-3" value={form.lastName} onChange={e => onChange("lastName", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">{tt('email')}</label>
                <input type="email" className="w-full border rounded-md h-10 px-3" value={form.email} onChange={e => onChange("email", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">{tt('address')}</label>
                <input className="w-full border rounded-md h-10 px-3" value={form.address} onChange={e => onChange("address", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">{tt('city')}</label>
                <input className="w-full border rounded-md h-10 px-3" value={form.city} onChange={e => onChange("city", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">{tt('zip')}</label>
                <input className="w-full border rounded-md h-10 px-3" value={form.zip} onChange={e => onChange("zip", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">{tt('country')}</label>
                <select className="w-full border rounded-md h-10 px-3" value={form.country} onChange={e => onChange("country", e.target.value)}>
                  <option value="DE">Germany</option>
                  <option value="TR">Türkiye</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                  <option value="NL">Netherlands</option>
                </select>
              </div>
              <label className="flex items-center gap-2 sm:col-span-2 mt-2">
                <input type="checkbox" checked={form.accept} onChange={e => onChange("accept", e.target.checked)} />
                <span className="text-sm">Mesafeli satış sözleşmesini ve <a className="underline" href="/agb" target="_blank">şartları</a> kabul ediyorum.</span>
              </label>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </section>

          {/* Order Summary */}
          <aside className="lg:col-span-2 space-y-4">
            <section className="rounded-lg border p-4">
              <h2 className="font-semibold mb-3">{tt('order_summary')}</h2>
              <ul className="divide-y">
                {items.map((it: any) => (
                  <li key={it.id} className="py-3 flex items-center gap-3">
                    {it.image ? (
                      <img src={it.image} alt={it.title} className="h-14 w-14 object-cover rounded-md border" />
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-neutral-100 grid place-items-center text-xs ring-1 ring-neutral-200">{tt('no_image')}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{it.title}</div>
                      <div className="text-xs text-neutral-500">{Number(it.price).toFixed(2)} €</div>
                      <div className="mt-1 inline-flex items-center gap-1.5">
                        <button className="h-6 w-6 grid place-items-center rounded-md border" onClick={() => updateQty(it.id, Math.max(1, (it.quantity || 1) - 1))}>-</button>
                        <input className="w-10 text-center border rounded-md h-6" value={it.quantity} onChange={(e) => updateQty(it.id, Math.max(1, parseInt(e.target.value || '1', 10) || 1))} />
                        <button className="h-6 w-6 grid place-items-center rounded-md border" onClick={() => updateQty(it.id, (it.quantity || 1) + 1)}>+</button>
                        <button className="ml-2 text-xs text-red-600 underline" onClick={() => remove(it.id)}>{tt('remove')}</button>
                      </div>
                    </div>
                    <div className="text-sm font-medium tabular-nums">{(it.price * it.quantity).toFixed(2)} €</div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between text-sm">
                <span>{tt('subtotal')}</span>
                <span className="tabular-nums">{totalStr} €</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-neutral-500">
                <span>{tt('shipping')}</span>
                <span>{tt('at_checkout')}</span>
              </div>
              <div className="mt-2 border-t pt-2 flex justify-between font-semibold">
                <span>{tt('grand_total')}</span>
                <span className="tabular-nums">{totalStr} €</span>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-lg border p-4">
              <h2 className="font-semibold mb-2">{tt('payment')}</h2>
              <p className="text-sm text-neutral-600 mb-3">{tt('paypal_secure')}</p>
              <div className="w-full max-w-sm">
  {valid ? (
    <CheckoutPayPal amount={totalStr} onApprove={handleApprove} />
  ) : (
    <div className="w-full h-[45px] grid place-items-center border rounded-md text-sm text-neutral-400 bg-neutral-50">
      {tt('fill_form_first')}
    </div>
  )}
</div>
              <button
                disabled={!valid || placing}
                onClick={placeOrder}
                className="mt-3 w-full h-10 rounded-md border text-sm disabled:opacity-60"
                title={!valid ? tt('fill_form_first') : tt('place_order_test')}
              >
                {placing ? tt('processing') : tt('place_order_test')}
              </button>
              <p className="text-xs text-neutral-500 mt-2">{tt('stock_note')}</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
