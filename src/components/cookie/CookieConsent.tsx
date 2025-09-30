"use client";
import {useEffect, useState} from "react";

const KEY = "cookie-consent-v1";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (!v) setOpen(true);
  }, []);

  const accept = () => {
    localStorage.setItem(KEY, JSON.stringify({analytics: true, marketing: false, date: Date.now()}));
    setOpen(false);
  };
  const decline = () => {
    localStorage.setItem(KEY, JSON.stringify({analytics: false, marketing: false, date: Date.now()}));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-4xl m-4 rounded-2xl shadow-lg border bg-white p-4 md:p-5">
        <p className="text-sm md:text-base">
          Wir verwenden Cookies. Für optionale Cookies (z. B. Analytics) benötigen wir Ihre Einwilligung.
          Details in unserer <a className="underline" href="/datenschutz">Datenschutzerklärung</a>.
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={decline} className="px-4 py-2 rounded-xl border">Nur Notwendige</button>
          <button onClick={accept} className="px-4 py-2 rounded-xl bg-black text-white">Alle Akzeptieren</button>
        </div>
      </div>
    </div>
  );
}
