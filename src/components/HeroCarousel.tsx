// src/components/HeroCarousel.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useMemo, useRef, useState} from "react";

type Cat = {
  id: string | number;
  name: string;
  slug?: string | null;
  image_url?: string | null;
  tagline?: string | null;
};

export default function HeroCarousel({cats = [] as Cat[]}) {
  const data = useMemo(
    () => (Array.isArray(cats) && cats.length ? cats : []),
    [cats]
  );

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);

  // autoplay
  useEffect(() => {
    if (data.length < 2) return;
    let t: any;
    if (!hover) t = setInterval(() => scrollBy("next"), 5500);
    return () => t && clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, data.length]);

  // active index
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = Math.max(1, el.clientWidth);
      const idx = Math.round(el.scrollLeft / w);
      setActive(Math.min(idx, Math.max(0, data.length - 1)));
    };
    el.addEventListener("scroll", onScroll, {passive: true});
    return () => el.removeEventListener("scroll", onScroll);
  }, [data.length]);

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({left: w * idx, behavior: "smooth"});
  };

  const scrollBy = (dir: "next" | "prev") => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const maxIdx = Math.max(0, data.length - 1);
    let nextIdx = active + (dir === "next" ? 1 : -1);
    if (nextIdx > maxIdx) nextIdx = 0;
    if (nextIdx < 0) nextIdx = maxIdx;
    el.scrollTo({left: w * nextIdx, behavior: "smooth"});
  };

  if (!data.length) return null;

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* SLIDES */}
      <div
        ref={scrollerRef}
        className="relative w-full overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory no-scrollbar"
        style={{WebkitOverflowScrolling: "touch"}}
      >
        <div className="flex w-full">
          {data.map((c, i) => {
            const href = c.slug ? `/category/${c.slug}` : "#";
            return (
              <div
                key={c.id ?? i}
                className="relative w-full flex-none snap-start overflow-hidden"
                style={{width: "100%"}}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${data.length}`}
              >
                <Link href={href} className="block group focus:outline-none">
                  {/* Sabit/akıcı yükseklik (taşma/jitter yok) */}
                  <div
                    className="relative w-full"
                    style={{
                      height: "clamp(220px, 40vw, 560px)",
                    }}
                  >
                    <Image
                      src={c.image_url || "/placeholder/hero.jpg"}
                      alt={c.name}
                      fill
                      sizes="100vw"
                      priority={i === 0}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent pointer-events-none"/>
                  </div>

                  {/* Metin katmanı */}
                  <div
                    className="pointer-events-none absolute inset-0 flex items-end pb-6 sm:pb-8 md:pb-10 lg:pb-12 xl:pb-14 px-4 sm:px-6 md:px-10">
                    <div className="max-w-screen-xl mx-auto w-full">
                      {/* Rozet / kategori adı */}
                      <div
                        className="inline-flex items-center gap-3 rounded-full bg-white/70 backdrop-blur px-4 py-2 lg:px-5 lg:py-2.5 shadow-sm ring-1 ring-black/10">
                        <span className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                          {c.name}
                        </span>
                      </div>

                      {/* Tagline – sadece büyük ekranlarda büyütüldü */}
                      {c.tagline ? (
                        <p
                          className="mt-3 max-w-3xl text-white/90 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                          {c.tagline}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* ARROWS (siyah ikonlar) */}
      {data.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy("prev")}
            aria-label="Önceki"
            className="pointer-events-auto hidden md:flex items-center justify-center
                       absolute left-4 top-1/2 -translate-y-1/2 z-30
                       w-12 h-12 rounded-full bg-white/70 hover:bg-white focus:bg-white shadow-lg ring-1 ring-black/10 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.5 18l-6-6 6-6" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scrollBy("next")}
            aria-label="Sonraki"
            className="pointer-events-auto hidden md:flex items-center justify-center
                       absolute right-4 top-1/2 -translate-y-1/2 z-30
                       w-12 h-12 rounded-full bg-white/70 hover:bg-white focus:bg-white shadow-lg ring-1 ring-black/10 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.5 6l6 6-6 6" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
          </button>
        </>
      )}

      {/* DOTS */}
      {data.length > 1 && (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {data.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                active === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
