"use client";

import {useEffect, useRef, useState} from "react";
import {useI18n} from "@/src/i18n/provider";
import {setLanguage} from "../../app/actions/setLanguage";
import clsx from "clsx";

/** Mini bayrak ikonları (SVG) */
function Flag({locale, className}: { locale: "tr" | "en" | "de"; className?: string }) {
  // Basit, net SVG’ler; keskin görünür ve her temada çalışır.
  if (locale === "tr") {
    return (
      <svg viewBox="0 0 64 64" className={clsx("rounded-full", className)}>
        <defs>
          <clipPath id="r">
            <circle cx="32" cy="32" r="32"/>
          </clipPath>
        </defs>
        <g clipPath="url(#r)">
          <rect width="64" height="64" fill="#e30a17"/>
          <circle cx="28" cy="32" r="12" fill="#fff"/>
          <circle cx="31" cy="32" r="10" fill="#e30a17"/>
          <path fill="#fff" d="M44.5,32 37,29 37,35z"/>
        </g>
      </svg>
    );
  }
  if (locale === "de") {
    return (
      <svg viewBox="0 0 60 60" className={clsx("rounded-full", className)}>
        <defs>
          <clipPath id="c">
            <circle cx="30" cy="30" r="30"/>
          </clipPath>
        </defs>
        <g clipPath="url(#c)">
          <rect width="60" height="20" y="0" fill="#000"/>
          <rect width="60" height="20" y="20" fill="#dd0000"/>
          <rect width="60" height="20" y="40" fill="#ffce00"/>
        </g>
      </svg>
    );
  }
  // en → UK stili
  return (
    <svg viewBox="0 0 60 60" className={clsx("rounded-full", className)}>
      <defs>
        <clipPath id="u">
          <circle cx="30" cy="30" r="30"/>
        </clipPath>
      </defs>
      <g clipPath="url(#u)">
        <rect width="60" height="60" fill="#012169"/>
        <path d="M0,0 60,60 M60,0 0,60" stroke="#fff" strokeWidth="12"/>
        <path d="M0,0 60,60 M60,0 0,60" stroke="#c8102e" strokeWidth="8"/>
        <path d="M30,0 v60 M0,30 h60" stroke="#fff" strokeWidth="16"/>
        <path d="M30,0 v60 M0,30 h60" stroke="#c8102e" strokeWidth="10"/>
      </g>
    </svg>
  );
}

type L = { code: "de" | "tr" | "en"; label: string; hint: string };
const LANGS: L[] = [
  {code: "de", label: "Deutsch", hint: "DE"},
  {code: "tr", label: "Türkçe", hint: "TR"},
  {code: "en", label: "English", hint: "EN"},
];

export default function LocaleSwitcher() {
  const {locale} = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // dışa tıklayınca kapan
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = (["de", "tr", "en"] as const).includes(locale as any)
    ? (locale as "de" | "tr" | "en")
    : "de";

  async function choose(l: "de" | "tr" | "en") {
    setOpen(false);
    await setLanguage(l);
    // yenile: server tarafı yeni messages ile render etsin
    window.location.reload();
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={clsx(
          "group inline-flex items-center gap-2 rounded-2xl border border-neutral-200/70",
          "bg-white/80 px-3 py-1.5 text-sm shadow-sm backdrop-blur hover:shadow transition",
          "focus:outline-none focus:ring-2 focus:ring-neutral-400"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
      >
        <Flag locale={current} className="h-4 w-4"/>
        <span className="hidden sm:inline font-medium">
          {LANGS.find((x) => x.code === current)?.label ?? current.toUpperCase()}
        </span>
        <svg
          className={clsx("h-4 w-4 transition-transform", open && "rotate-180")}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M5 7l5 6 5-6" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className={clsx(
            "absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-2xl border border-neutral-200/70",
            "bg-white/95 shadow-lg backdrop-blur p-1.5"
          )}
        >
          {LANGS.map((l) => {
            const active = l.code === current;
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={active}
                onClick={() => choose(l.code)}
                className={clsx(
                  "w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm",
                  active
                    ? "bg-neutral-100/90 font-medium"
                    : "hover:bg-neutral-50"
                )}
              >
                <Flag locale={l.code} className="h-4 w-4"/>
                <span className="flex-1 text-left">{l.label}</span>
                {active && (
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-emerald-600">
                    <path
                      d="M7.5 13.5l-3-3 1.4-1.4 1.6 1.6 6-6 1.4 1.4-7.4 7.4z"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
