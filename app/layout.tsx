// app/layout.tsx
import React from "react";
import type {Metadata} from "next";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import {CartProvider} from "@/src/components/cart/CartContext";
import {cookies} from "next/headers";
import {I18nProvider} from "@/src/i18n/provider";
import DOMTranslate from "@/src/i18n/DOMTranslate";
import GoogleAnalytics from "@/src/components/GoogleAnalytics";
import PageViewTracker from "@/src/components/PageViewTracker"; // opsiyonel
import CookieConsent from "@/src/components/cookie/CookieConsent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NuThings",
  description: "Premium Nüsse & Köstlichkeiten",
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const jar = await cookies();
  const locale = (jar.get("lang")?.value as "de" | "tr" | "en") ?? "de";

  let messages: Record<string, any> = {};
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    messages = {};
  }

  return (
    <html lang={locale}>
    <body className="overflow-x-clip">
    <I18nProvider locale={locale} messages={messages}>
      <DOMTranslate/>
      <CartProvider>
        <Navbar/>
        {props.children}
        <Footer/>
      </CartProvider>
    </I18nProvider>

    {/* Analytics */}
    <GoogleAnalytics/>
    <PageViewTracker/>
        <CookieConsent/>
    </body>
    </html>
  );
}
