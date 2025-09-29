"use client";
import React from "react";
import {useCart} from "./CartContext";
import {ShoppingCartIcon} from "@/src/components/Icons";
import {useI18n} from "@/src/i18n/provider";

type Props = {
  className?: string;
  /** Tıklamadan önce opsiyonel tetiklenecek callback (ör. mobil menüyü kapat) */
  onClickBefore?: () => void;
};

export default function CartButton({className = "", onClickBefore}: Props) {
  const {count, toggleCart} = useCart();
  const {t} = useI18n() as any;
  const TR = (ns: string, key: string, fb: string) => {
    try {
      const v = t(ns, key);
      return (v && v !== key) ? v : fb;
    } catch {
      return fb;
    }
  };

  const handleClick = () => {
    try {
      onClickBefore?.();
    } finally {
      toggleCart();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-neutral-50 ${className}`}
    >
      <ShoppingCartIcon className="h-4 w-4"/>
      <span className="text-sm font-medium hidden sm:inline">{TR("cart", "button", "Warenkorb")}</span>
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[20px] h-[20px] text-[11px] grid place-items-center rounded-full bg-black text-white px-1">
          {count}
        </span>
      )}
    </button>
  );
}
