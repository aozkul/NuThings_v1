"use client";
import { create } from "zustand";
const dict = {
  tr: { home:"Ana Sayfa", products:"Ürünler", admin:"Admin", shop:"Alışverişe Başla" },
  de: { home:"Startseite", products:"Produkte", admin:"Admin", shop:"Jetzt einkaufen" },
  en: { home:"Home", products:"Products", admin:"Admin", shop:"Shop Now" },
};
type Lang = keyof typeof dict;
type State = { lang: Lang; t: (k: keyof typeof dict["en"])=>string; setLang:(l:Lang)=>void };
export const useI18n = create<State>((set,get)=>({
  lang:"tr",
  setLang:(l)=>set({lang:l}),
  t:(k)=>{ const d=dict[get().lang]||dict.en; return (d as any)[k]||k; }
}));
