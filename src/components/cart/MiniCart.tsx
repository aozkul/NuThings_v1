"use client";

import React, {useEffect, useRef} from "react";
import Link from "next/link";
import Image from "next/image";
import {useCart} from "./CartContext";
import {useI18n} from "@/src/i18n/provider";
import {ShoppingCartIcon} from "@/src/components/Icons";

export default function MiniCart() {
  const {t, locale} = useI18n() as any;
  const TR = (ns: string, key: string, fb: string) => {
    try {
      const v = t(ns, key);
      return (v && v !== key) ? v : fb;
    } catch {
      return fb;
    }
  };

  const {items, open, closeCart, removeItem, updateQty, total, count, clear} = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeCart]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (open) {
      html.classList.add("overflow-hidden");
      body.classList.add("overflow-hidden");
    } else {
      html.classList.remove("overflow-hidden");
      body.classList.remove("overflow-hidden");
    }
  }, [open]);

  return (
    <div aria-hidden={!open}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeCart}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-[100] h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog" aria-modal="true" aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5"/>
            <h2 className="text-base font-semibold">{TR("cart", "title", "Warenkorb")}</h2>
            <span className="text-sm text-neutral-500">({count})</span>
          </div>
          <button onClick={closeCart} className="rounded-lg border px-2.5 py-1.5 hover:bg-neutral-50">✕</button>
        </div>

        <div className="flex h-[calc(100%-8rem)] flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-600 p-3">{TR("cart", "empty", "Ihr Warenkorb ist leer.")}</p>
            ) : items.map(it => (
              <div key={it.id} className="flex items-center gap-3 rounded-xl border p-2">
                {it.image ? (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-neutral-100 ring-1 ring-neutral-200">
                    <Image src={it.image} alt={it.title} fill sizes="64px" className="object-cover"/>
                  </div>
                ) : (
                  <div
                    className="h-16 w-16 rounded-lg bg-neutral-100 grid place-items-center text-xs ring-1 ring-neutral-200">No
                    image</div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{it.title}</div>
                  <div className="text-xs text-neutral-500">{(it.price).toFixed(2)} €</div>
                  <div className="mt-1 inline-flex items-center gap-1.5">
                    <button className="h-6 w-6 grid place-items-center rounded-md border"
                            onClick={() => updateQty(it.id, it.quantity - 1)}>-
                    </button>
                    <input className="w-10 text-center border rounded-md h-6" value={it.quantity}
                           onChange={(e) => updateQty(it.id, parseInt(e.target.value || '1', 10) || 1)}/>
                    <button className="h-6 w-6 grid place-items-center rounded-md border"
                            onClick={() => updateQty(it.id, it.quantity + 1)}>+
                    </button>
                    {typeof it.stock === "number" ? <span
                      className="text-[11px] text-neutral-500 ml-2">{TR("cart", "stock", "Lager")}: {it.stock}</span> : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm font-semibold">{(it.price * it.quantity).toFixed(2)} €</div>
                  <button
                    title={TR("cart", "remove", "Entfernen")}
                    aria-label={TR("cart", "remove", "Entfernen")}
                    onClick={() => removeItem(it.id)}
                    className="h-7 w-7 grid place-items-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" stroke="currentColor" fill="none" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round"></polyline>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" fill="none"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M10 11v6" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round"
                            strokeLinejoin="round"></path>
                      <path d="M14 11v6" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round"
                            strokeLinejoin="round"></path>
                      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" fill="none"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">{TR("cart", "subtotal", "Zwischensumme")}</span>
              <span className="text-base font-semibold">{total.toFixed(2)} €</span>
            </div>
            <div className="flex gap-2">
              <button onClick={clear}
                      className="flex-1 rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50">{TR("cart", "clear", "Leeren")}</button>
              <Link href="/checkout" onClick={closeCart}
                    className="flex-1 rounded-xl bg-black text-white px-4 py-2 text-sm text-center hover:shadow">{TR("cart", "checkout", "Zur Kasse")}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
