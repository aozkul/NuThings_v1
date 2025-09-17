"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";
import type {Product} from "@/src/lib/types";
import {useI18n} from "@/src/i18n/provider";

type P = Pick<Product, "id" | "name" | "slug" | "price" | "image_url" | "image_alt">;

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

type Props = {
    /** Ürün detay sayfasından geç: slug daha stabil */
    seedSlug: string;
    /** Kaç ürün gösterilsin */
    limit?: number;
};

export default function RelatedCarousel({seedSlug, limit = 12}: Props) {
    const {messages} = useI18n();
    const T = (k: "related_title", fb: string) =>
        ((messages as any)?.product?.[k] as string) ?? fb;

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

    // Benzer ürünleri getir: 1) aynı kategori (xref) -> 2) products.category_id -> 3) isim benzerliği -> 4) fallback: yeni ürünler
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);

            // seed ürünü bul
            const {data: seed} = await supabase
                .from("products")
                .select("id,name,slug")
                .eq("slug", seedSlug)
                .single();

            if (!mounted) return;
            if (!seed?.id) {
                setItems([]);
                setLoading(false);
                return;
            }

            // 1) product_categories xref: aynı kategoridekiler
            let relatedIds: string[] = [];
            try {
                const {data: xcats} = await supabase
                    .from("product_categories")
                    .select("category_id")
                    .eq("product_id", seed.id);

                const catIds = (xcats ?? []).map((r: any) => r.category_id).filter(Boolean);
                if (catIds.length) {
                    const {data: xprods} = await supabase
                        .from("product_categories")
                        .select("product_id")
                        .in("category_id", catIds as any)
                        .limit(200);
                    relatedIds = Array.from(new Set((xprods ?? [])
                        .map((r: any) => r.product_id)
                        .filter((pid: string) => pid && pid !== seed.id)));
                }
            } catch { /* tablo yoksa sorun değil */
            }

            // 2) products.category_id varsa
            if (!relatedIds.length) {
                try {
                    const {data: seedCat} = await supabase
                        .from("products")
                        .select("category_id")
                        .eq("id", seed.id)
                        .single();
                    if (seedCat?.category_id) {
                        const {data: sameCat} = await supabase
                            .from("products")
                            .select("id")
                            .eq("category_id", seedCat.category_id)
                            .neq("id", seed.id)
                            .limit(200);
                        relatedIds = (sameCat ?? []).map((p: any) => p.id);
                    }
                } catch { /* kolon yoksa geç */
                }
            }

            let final: P[] = [];

            if (relatedIds.length) {
                const {data: prods} = await supabase
                    .from("products")
                    .select("id,name,slug,price,image_url,image_alt")
                    .in("id", relatedIds as any)
                    .limit(100);
                // Basit skor: ada benzerlik (aynı kelime varsa üstte) + updated_at yoksa alfabetik
                const tokens = String(seed.name ?? "")
                    .toLowerCase()
                    .split(/\s+/)
                    .filter(w => w.length >= 3);
                const score = (p: any) => {
                    const n = String(p.name ?? "").toLowerCase();
                    return tokens.reduce((s, t) => s + (n.includes(t) ? 1 : 0), 0);
                };
                final = (prods ?? [])
                    .filter((p: any) => p.id !== seed.id)
                    .sort((a: any, b: any) => score(b) - score(a))
                    .slice(0, limit) as P[];
            }

            // 3) İsim benzerliği (xref/kolon yoksa)
            if (!final.length && seed?.name) {
                const tokens = String(seed.name).split(/\s+/).filter((w: string) => w.length >= 3);
                let likeToken = tokens[0];
                if (likeToken) {
                    const {data: nameLike} = await supabase
                        .from("products")
                        .select("id,name,slug,price,image_url,image_alt")
                        .ilike("name", `%${likeToken}%`)
                        .neq("id", seed.id)
                        .limit(limit + 6);
                    final = (nameLike ?? []).slice(0, limit) as P[];
                }
            }

            // 4) Fallback: en güncel ürünler
            if (!final.length) {
                const {data: latest} = await supabase
                    .from("products")
                    .select("id,name,slug,price,image_url,image_alt")
                    .neq("id", seed.id)
                    .order("updated_at", {ascending: false})
                    .limit(limit);
                final = (latest ?? []) as P[];
            }

            if (!mounted) return;
            setItems(final);
            setLoading(false);
        })();

        return () => {
            mounted = false;
        };
    }, [seedSlug, limit]);

    // reduced motion
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
                        {T("related_title", "Benzer Ürünler")}
                    </h2>
                    <span className="h-2 w-28 rounded bg-neutral-200 animate-pulse"/>
                </div>
                <div className="flex gap-4">
                    {Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="w-56 sm:w-64 md:w-72 flex-shrink-0">
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
                    {T("related_title", "Benzer Ürünler")}
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
                            className="group relative flex-shrink-0 w-56 sm:w-64 md:w-72"
                        >
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
                                            className="object-cover transition-transform duration-300 will-change-transform group-hover:scale-[1.03]"
                                            sizes="(max-width: 768px) 60vw, (max-width: 1200px) 33vw, 25vw"
                                            priority={i < 3}
                                        />
                                    ) : (
                                        <div className="h-full w-full grid place-items-center text-neutral-400">Görsel
                                            yok</div>
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
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
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
