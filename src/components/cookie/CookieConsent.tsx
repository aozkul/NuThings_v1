"use client";
import { useEffect, useState } from "react";

const KEY = "cookie-consent-v1";
const COOKIE_NAME = "cookie_consent";
const ONE_YEAR = 60*60*24*365;

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!v) setOpen(true);
  }, []);

  const accept = () => {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=all; max-age=${ONE_YEAR}; path=/`;
    }
    localStorage.setItem(KEY, JSON.stringify({ analytics: true, marketing: false, date: Date.now() }));
    setOpen(false);
  };
  const decline = () => {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=essential; max-age=${ONE_YEAR}; path=/`;
    }
    localStorage.setItem(KEY, JSON.stringify({ analytics: false, marketing: false, date: Date.now() }));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-end md:justify-center bg-black/20">
      <div className="mx-auto max-w-4xl m-4 rounded-2xl shadow-lg border bg-white p-4 md:p-5 w-[calc(100%-2rem)]">
        <p className="text-sm md:text-base">
          Wir verwenden Cookies. Für optionale Cookies (z. B. Analytics) benötigen wir Ihre Einwilligung.
          Details in unserer <a className="underline" href="/datenschutz">Datenschutzerklärung</a>.
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={decline} className="px-4 py-2 rounded-xl border">Nur Notwendige</button>
          <button onClick={accept} className="px-4 py-2 rounded-xl bg-black text-white">Alle Akzeptieren</button>
                <a className="px-4 py-2 rounded-xl border" href="/cookies">Einstellungen</a>
        </div>
      </div>
    </div>
  );
}
