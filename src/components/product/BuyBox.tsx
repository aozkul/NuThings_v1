"use client";

import React from "react";
import {useCart} from "@/src/components/cart/CartContext";
import {useI18n} from "@/src/i18n/provider";

/** küçük yardımcı */
function byLocale(locale: "de" | "tr" | "en", tr: string, de: string, en: string) {
  return locale === "tr" ? tr : locale === "de" ? de : en;
}

export default function BuyBox({
                                 productId,
                                 stock,
                                 price,
                                 title,
                                 imageUrl,
                               }: {
  productId: string;
  stock: number | null | undefined;
  price: number | null | undefined;
  title?: string;
  imageUrl?: string;
}) {
  const {locale} = useI18n() as any;
  const {addItem, openCart} = useCart();

  const [qty, setQty] = React.useState(1);
  const [busy, setBusy] = React.useState(false);

  const safeStock = typeof stock === "number" ? stock : 0;
  const canBuy = safeStock > 0;

  // fiyat formatı – locale'e göre
  const fmt = React.useMemo(
    () =>
      new Intl.NumberFormat(
        locale === "de" ? "de-DE" : locale === "tr" ? "tr-TR" : "en-US",
        {style: "currency", currency: "EUR", maximumFractionDigits: 2}
      ),
    [locale]
  );

  // stok rozet rengi
  const stockTone =
    safeStock <= 0
      ? {ring: "ring-red-200/80", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500"}
      : safeStock <= 3
        ? {ring: "ring-amber-200/80", bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500"}
        : {ring: "ring-emerald-200/80", bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500"};

  const stockLabel = canBuy
    ? byLocale(locale, "Stokta", "Auf Lager", "In stock")
    : byLocale(locale, "Stok yok", "Nicht auf Lager", "Out of stock");

  const LABEL_QTY = byLocale(locale, "Adet", "Menge", "Qty");
  const LABEL_ADD = byLocale(locale, "Sepete Ekle", "In den Warenkorb", "Add to Cart");
  const LABEL_UNAV = byLocale(locale, "Stok yok", "Nicht verfügbar", "Unavailable");

  function addToCart() {
    if (!canBuy) return;

    // 1) props
    let name = typeof title === "string" && title.trim() ? title : "";
    let img = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl : "";

    // 2) data-product-json (ek garanti)
    if (!name || !img) {
      try {
        const el = document.querySelector('[data-product-json]') as HTMLScriptElement | null;
        if (el?.textContent) {
          const meta = JSON.parse(el.textContent);
          if (!name && typeof meta?.title === "string") name = meta.title;
          if (!img && typeof meta?.imageUrl === "string") img = meta.imageUrl;
        }
      } catch {
      }
    }

    // 3) dil fallback
    if (!name) name = locale === "de" ? "Produkt" : locale === "en" ? "Product" : "Ürün";

    const item = {
      id: String(productId),
      title: name,
      price: typeof price === "number" ? price : 0,
      image: img || undefined,
      stock: typeof stock === "number" ? stock : null,
    } as const;

    addItem(item as any, qty);
    openCart();
  }

  function buy() {
    try {
      setBusy(true);
      addToCart();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-neutral-200/70 bg-white/70 backdrop-blur-sm shadow-sm p-4 md:p-5">
      {/* Üst satır: stok rozeti ve fiyat */}
      <div className="flex items-center justify-between gap-3">
        <div
          className={[
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
            stockTone.bg, stockTone.text, stockTone.ring,
          ].join(" ")}
        >
          <span className={["h-1.5 w-1.5 rounded-full", stockTone.dot].join(" ")}/>
          {stockLabel} {typeof stock === "number" ? `(${safeStock})` : ""}
        </div>

        <div className="text-lg md:text-xl font-semibold tabular-nums">
          {typeof price === "number" ? fmt.format(price) : "—"}
        </div>
      </div>

      {/* Alt satır: adet + sepete ekle yan yana */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        {/* Miktar kontrolü */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-700">{LABEL_QTY}</label>

          <div className="inline-flex items-stretch overflow-hidden rounded-2xl ring-1 ring-neutral-200">
            <button
              type="button"
              onClick={() => setQty(v => Math.max(1, v - 1))}
              disabled={!canBuy}
              className="px-3 py-2 text-base hover:bg-neutral-50 disabled:opacity-40"
              aria-label="decrease quantity"
            >
              −
            </button>

            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(1, safeStock)}
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, Math.min(Number(e.target.value) || 1, Math.max(1, safeStock))))
              }
              className="w-16 text-center px-2 py-2 text-sm outline-none"
              aria-live="polite"
            />

            <button
              type="button"
              onClick={() => setQty(v => Math.min(v + 1, Math.max(1, safeStock)))}
              disabled={!canBuy}
              className="px-3 py-2 text-base hover:bg-neutral-50 disabled:opacity-40"
              aria-label="increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Sepete ekle butonu */}
        <button
          disabled={!canBuy || busy}
          onClick={buy}
          className={[
            "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm md:text-base font-semibold transition-all",
            "shadow-sm hover:shadow",
            canBuy
              ? "bg-black text-white hover:bg-neutral-900 active:scale-[0.99]"
              : "bg-neutral-300 text-neutral-600 cursor-not-allowed",
          ].join(" ")}
          aria-disabled={!canBuy || busy}
          title={!canBuy ? LABEL_UNAV : ""}
        >
          {busy ? "…" : LABEL_ADD}
        </button>
      </div>
    </div>
  );
}
