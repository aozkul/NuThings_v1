"use client";
import React from "react";
import {useCart} from "./CartContext";
import {useI18n} from "@/src/i18n/provider";
import {ShoppingCartIcon} from "@/src/components/Icons";

export default function CartButton(){
  const { t, locale } = useI18n() as any;
  const TR = (ns:string, key:string, fb:string) => { try{ const v=t(ns,key); return (v&&v!==key)?v:fb; }catch{return fb;} };
  const {count, toggleCart} = useCart();
  return (
    <button onClick={toggleCart} className="relative inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-neutral-50">
      <ShoppingCartIcon className="h-4 w-4"/>
      <span className="text-sm font-medium hidden sm:inline">{TR("cart","button","Warenkorb")}</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] text-[11px] grid place-items-center rounded-full bg-black text-white px-1">
          {count}
        </span>
      )}
    </button>
  );
}
