"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";
import type {Product} from "@/src/lib/types";
import {useI18n} from "@/src/i18n/provider";

type P = Pick<Product, "id" | "name" | "slug" | "price" | "image_url" | "image_alt"> & {
  likes?: number,
  is_featured?: boolean
};

const GAP_PX = 16;
const AUTO_MS = 3500;
const TRANS_MS = 450;
const EASE = "ease-out";

function formatEUR(n?: number | null) {
  if (typeof n !== "number") return "—";
  try {
    return new Intl.NumberFormat("de-DE", {style: "currency", currency: "EUR"}).format(n);
  } catch {
    return `${n.toFixed(2)} €`;
  }
}

export default function MostLikedCarousel() {
  const {messages} = useI18n();
  const T = (k: "most_liked_title" | "featured_badge", fb: string) =>
    ((messages as any)?.home?.[k] as string) ?? fb;

  const [items, setItems] = useState<P[]>([]);
  const [index, setIndex] = useState(0);
  const [slideW, setSlideW] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstSlide = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const hoveringRef = useRef(false);
  const touchingRef = useRef<null | { startX: number, lastX: number }>(null);

  const [progKey, setProgKey] = useState(0);
  const progRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);

      // Öncelik: product_stats
      const {data: stats} = await supabase
        .from("product_stats")
        .select("product_id, likes")
        .gt("likes", 0)
        .order("likes", {ascending: false})
        .limit(24);

      if (!mounted) return;

      if (stats && stats.length) {
        const ids = stats.map(s => s.product_id).filter(Boolean);
        const {data: prods} = await supabase
          .from("products")
          .select("id,name,slug,price,image_url,image_alt,is_featured")
          .in("id", ids as any);

        if (prods) {
          const likesMap = new Map(stats.map(s => [s.product_id, s.likes]));
          const map = new Map(prods.map(p => [p.id, p]));
          const ordered: P[] = [];
          for (const s of stats) {
            const p = map.get(s.product_id);
            if (p) ordered.push({...(p as any), likes: likesMap.get(s.product_id) ?? undefined});
          }
          setItems(ordered);
          setLoading(false);
          return;
        }
      }

      // Yedek: products.likes / like_count
      const {data: fallback} = await supabase
        .from("products")
        .select("id,name,slug,price,image_url,image_alt,likes,like_count")
        .order("likes", {ascending: false})
        .limit(24);

      const normalized = (fallback ?? []).map((p: any) => ({
        id: p.id, name: p.name, slug: p.slug,
        price: p.price, image_url: p.image_url, image_alt: p.image_alt,
        likes: typeof p.likes === "number" ? p.likes :
          typeof p.like_count === "number" ? p.like_count : undefined
      })) as P[];

      setItems(normalized.filter(x => (x.likes ?? 0) > 0).length ? normalized.filter(x => (x.likes ?? 0) > 0) : normalized);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setPrefersReduced(!!mql.matches);
    handler();
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  // ölç
  const measure = () => {
    const el = firstSlide.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSlideW(Math.round(rect.width + GAP_PX));
  };
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [items.length]);

  // translate
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = `transform ${prefersReduced ? 0 : TRANS_MS}ms ${EASE}`;
    track.style.transform = `translateX(-${index * slideW}px)`;
  }, [index, slideW, prefersReduced]);

  // autoplay
  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const startTimer = () => {
    if (prefersReduced) return;
    clearTimer();
    timerRef.current = window.setInterval(() => {
      if (hoveringRef.current || touchingRef.current) return;
      next();
    }, AUTO_MS) as unknown as number;
  };
  useEffect(() => {
    if (items.length > 1 && slideW > 0) {
      startTimer();
      setProgKey(k => k + 1);
    }
    return () => clearTimer();
  }, [items.length, slideW, prefersReduced]);

  // progress genişliği
  useEffect(() => {
    const el = progRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.width = "0%";
    requestAnimationFrame(() => {
      if (!el) return;
      el.style.transition = prefersReduced ? "none" : `width ${AUTO_MS}ms linear`;
      el.style.width = "100%";
    });
  }, [progKey, prefersReduced]);

  const next = () => setIndex(i => (i + 1) % Math.max(items.length, 1));
  const prev = () => setIndex(i => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));

  const onMouseEnter = () => {
    hoveringRef.current = true;
  };
  const onMouseLeave = () => {
    hoveringRef.current = false;
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchingRef.current = {startX: e.touches[0].clientX, lastX: e.touches[0].clientX};
    clearTimer();
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!touchingRef.current) return;
    touchingRef.current.lastX = e.touches[0].clientX;
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    const info = touchingRef.current;
    touchingRef.current = null;
    const dx = info ? info.lastX - info.startX : 0;
    if (Math.abs(dx) > 40) {
      dx < 0 ? next() : prev();
    }
    startTimer();
    setProgKey(k => k + 1);
  };

  const safeItems = useMemo(() => items ?? [], [items]);
  const dots = safeItems.length;

  if (loading) {
    return (
      <section className="relative">
        <div className="mb-4 flex flex-col items-center gap-2">
          <h2 className="text-xl md:text-2xl font-semibold text-center">
            {T("most_liked_title", "En Çok Beğenilen")}
          </h2>
          <span className="h-2 w-28 rounded bg-neutral-200 animate-pulse"/>
        </div>
        <div className="flex gap-4">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="w-64 sm:w-72 md:w-80 flex-shrink-0">
              <div className="aspect-[1/1] rounded-2xl bg-neutral-100 animate-pulse"/>
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse"/>
                <div className="h-4 w-1/3 rounded bg-neutral-200 animate-pulse"/>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!safeItems.length) return null;

  return (
    <section className="relative">
      {/* başlık + progress */}
      <div className="mb-3 flex flex-col items-center gap-2">
        <h2 className="text-xl md:text-2xl font-semibold text-center">
          {T("most_liked_title", "En Çok Beğenilen")}
        </h2>
        {!prefersReduced && (
          <div className="relative h-1 w-28 overflow-hidden rounded bg-neutral-200">
            <div ref={progRef} key={progKey} className="h-full bg-neutral-800/80 w-0"/>
          </div>
        )}
      </div>

      {/* carousel */}
      <div
        ref={viewportRef}
        className="relative overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex gap-4 will-change-transform"
          style={{transform: `translateX(-${index * slideW}px)`}}
          aria-live="polite"
        >
          {safeItems.map((p, i) => (
            <div
              key={p.id}
              ref={i === 0 ? firstSlide : undefined}
              className="group relative flex-shrink-0 w-64 sm:w-72 md:w-80"
            >
              <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
                <div
                  className="rounded-full px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-fuchsia-600 to-violet-600 shadow flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.22 2.61C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {typeof (p as any).likes === "number" ? `${(p as any).likes}` : "Popüler"}  </div>
                {(p as any).is_featured ? (<div
                  className="rounded-full px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow">      {T("featured_badge", "Öne Çıkan")}    </div>) : null}
              </div>
              <Link
                href={`/products/${p.slug}`}
                className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[1/1] bg-neutral-50">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.image_alt ?? p.name}
                      fill
                      sizes="(max-width: 768px) 60vw, (max-width: 1200px) 33vw, 25vw"
                      priority={i < 3}
                      className="object-cover"/>
                  ) : (
                    <div className="h-full w-full grid place-items-center text-neutral-400">Görsel yok</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-sm md:text-base font-medium text-neutral-900">
                    {p.name}
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">
                    {formatEUR(p.price)}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* oklar */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
          <button
            type="button"
            aria-label="Önceki"
            onClick={() => {
              prev();
              clearTimer();
              startTimer();
              setProgKey(k => k + 1);
            }}
            className="pointer-events-auto ml-1 md:ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 border border-neutral-200 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            aria-label="Sonraki"
            onClick={() => {
              next();
              clearTimer();
              startTimer();
              setProgKey(k => k + 1);
            }}
            className="pointer-events-auto mr-1 md:mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 border border-neutral-200 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* dots */}
        {dots > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({length: dots}).map((_, i) => (
              <button
                key={i}
                aria-label={`Slayt ${i + 1}`}
                onClick={() => {
                  setIndex(i);
                  clearTimer();
                  startTimer();
                  setProgKey(k => k + 1);
                }}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-neutral-900" : "w-2 bg-neutral-300 hover:bg-neutral-400"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
