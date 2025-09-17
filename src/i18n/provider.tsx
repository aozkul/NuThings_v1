"use client";
import React, {createContext, useContext, ReactNode} from "react";

type Messages = Record<string, any>;
type Locale = "de" | "tr" | "en";

type I18nContextType = {
  locale: Locale;
  messages: Messages;
  t: (ns: string, key: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({locale, messages, children}: {locale: Locale; messages: Messages; children: ReactNode}) {
  const t = (ns: string, key: string) => {
    const nsObj = (messages as any)[ns] || {};
    return nsObj[key] ?? key;
  };
  return (
    <I18nContext.Provider value={{locale, messages, t}}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
