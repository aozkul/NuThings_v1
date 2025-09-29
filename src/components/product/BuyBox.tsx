"use client";
import React from "react";
import { useI18n } from "@/src/i18n/provider";

function byLocale(locale: "de"|"tr"|"en", tr: string, de: string, en: string){
  return locale === "tr" ? tr : locale === "de" ? de : en;
}

export default function BuyBox({
  productId,
  stock,
  price,
}: {
  productId: string;
  stock: number | null | undefined;
  price: number | null | undefined;
}) {
  const { t, locale } = useI18n() as any;

  // Robust translator: try multiple namespaces/keys, else locale fallback
  const tryKeys = (pairs: Array<[string,string]>, fallback: string) => {
    for (const [ns,key] of pairs){
      try{
        const v = t(ns, key);
        if (typeof v === "string" && v.trim() && !/^[a-z0-9_.-]+$/i.test(v)) return v;
      }catch{ /* ignore */ }
    }
    return fallback;
  };

  const LABEL_STATUS = tryKeys(
    [
      ["product","lagerstatus_label"],
      ["product","lagerstatus"],
      ["common","lagerstatus"],
      ["products_page","lagerstatus"],
    ],
    byLocale(locale, "Stok durumu", "Lagerstatus", "Stock")
  );

  const TEXT_IN  = tryKeys(
    [
      ["product","status_in_stock"],
      ["product","in_stock_label"],
      ["product","in_stock"],
      ["common","in_stock"],
      ["products_page","in_stock"],
      ["filter","in_stock"],
    ],
    byLocale(locale, "Stokta", "Auf Lager", "In stock")
  );

  const TEXT_OUT = tryKeys(
    [
      ["product","status_out_of_stock"],
      ["product","out_of_stock_label"],
      ["product","out_of_stock"],
      ["common","out_of_stock"],
      ["products_page","out_of_stock"],
      ["filter","out_of_stock"],
    ],
    byLocale(locale, "Stokta yok", "Nicht auf Lager", "Out of stock")
  );

  const LABEL_QTY = tryKeys(
    [
      ["product","quantity"],
      ["common","quantity"],
      ["products_page","quantity"],
      ["filter","quantity"],
    ],
    byLocale(locale, "Adet", "Menge", "Quantity")
  );

  const LABEL_BUY = tryKeys(
    [
      ["product","buy"],
      ["common","buy"],
      ["products_page","buy"],
    ],
    byLocale(locale, "Satın Al", "Kaufen", "Buy")
  );

  const LABEL_UNAV = tryKeys(
    [
      ["product","unavailable"],
      ["common","unavailable"],
    ],
    byLocale(locale, "Stokta olmadığı için satın alınamaz", "Nicht verfügbar – kein Lagerbestand", "Unavailable – out of stock")
  );

  const [qty, setQty] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const safeStock = typeof stock === "number" ? stock : 0;
  const canBuy = safeStock > 0;
  const low = canBuy && safeStock <= 5;

  async function buy() {
    try {
      setBusy(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ product_id: productId, quantity: qty }] }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error?.includes("OUT_OF_STOCK") ? TEXT_OUT : "Error");
        return;
      }
      alert(byLocale(locale, "Sipariş oluşturuldu", "Bestellung erstellt", "Order placed"));
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border p-4 bg-white/60 backdrop-blur-sm shadow-sm">
      {/* Top row: Lagerstatus + price */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-700">{LABEL_STATUS}</span>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium
              ${canBuy ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
          >
            <span className={`h-2 w-2 rounded-full ${canBuy ? "bg-green-500" : "bg-red-500"}`} aria-hidden />
            {canBuy ? TEXT_IN : TEXT_OUT}
            {canBuy && <span className="ml-1 opacity-70">· {safeStock}</span>}
          </span>
          {low && (
            <span className="text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-full px-2 py-0.5">
              {byLocale(locale, "Az kaldı", "Nur wenige übrig", "Only a few left")}
            </span>
          )}
        </div>

        {typeof price === "number" ? (
          <div className="text-2xl sm:text-3xl font-bold tabular-nums">
            {price.toFixed(2)} <span className="text-base font-normal text-neutral-600">€</span>
          </div>
        ) : (
          <div className="text-neutral-500">—</div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-neutral-800">{LABEL_QTY}</label>
        <div className="inline-flex items-stretch rounded-xl ring-1 ring-neutral-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setQty(v => Math.max(1, v - 1))}
            disabled={!canBuy}
            className="px-3 py-2 disabled:opacity-40"
            aria-label="decrease"
          >−</button>
          <input
            type="number"
            min={1}
            max={Math.max(1, safeStock)}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value) || 1, safeStock)))}
            className="w-20 text-center outline-none px-2 py-2"
            disabled={!canBuy}
          />
          <button
            type="button"
            onClick={() => setQty(v => Math.min(safeStock, v + 1))}
            disabled={!canBuy}
            className="px-3 py-2 disabled:opacity-40"
            aria-label="increase"
          >+</button>
        </div>

        <button
          disabled={!canBuy || busy}
          onClick={buy}
          className="rounded-xl bg-black px-5 py-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-400 shadow-sm hover:shadow transition"
          aria-disabled={!canBuy || busy}
          title={!canBuy ? LABEL_UNAV : ""}
        >
          {busy ? "…" : LABEL_BUY}
        </button>
      </div>
    </div>
  );
}
