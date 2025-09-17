"use client";

import Link from "next/link";
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
    if (!scrollerRef.current || !data.length) return;
    const el = scrollerRef.current;
    let timer: any = null;

    const tick = () => {
      if (hover) return;
      const w = el.clientWidth;
      const max = el.scrollWidth - w;
      let next = el.scrollLeft + w;
      if (next > max + 10) next = 0;
      el.scrollTo({left: next, behavior: "smooth"});
    };

    timer = setInterval(tick, 4500);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [hover, data.length]);

  // aktif index
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

  const goto = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({left: w * i, behavior: "smooth"});
  };

  const scrollBy = (dir: "prev" | "next") => {
    const i = dir === "next" ? active + 1 : active - 1;
    const clamped = Math.max(0, Math.min(data.length - 1, i));
    goto(clamped);
  };

  if (!data.length) return null;

  return (
    <section
      className="relative left-1/2 -translate-x-1/2 w-[100vw] max-w-[100vw] overflow-x-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* tek slayt = tam genişlik */}
      <div
        ref={scrollerRef}
        className="relative overflow-x-auto overflow-y-visible no-scrollbar scroll-smooth snap-x snap-mandatory flex gap-0 w-full"
      >
        {data.map((c, i) => (
          <div key={`${c.id}-${i}`} className="snap-center min-w-full">
            <Link href={c.slug ? `/category/${c.slug}` : `/category/${c.id}` } className="group block relative overflow-hidden">
              {/* yükseklik: bir önceki küçültülmüş değerler */}
              <div className="relative w-full h-[320px] sm:h-[420px] lg:h-[520px] xl:h-[580px]">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name || "Kategori"}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"   // <— DÜZELTİLDİ
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-neutral-100">
                    <span className="text-neutral-400">Görsel yok</span>
                  </div>
                )}

                {/* hafif overlay */}
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.20),transparent_22%,transparent_78%,rgba(0,0,0,.28))]"/>

                {/* başlık & tagline */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
                  <h3
                    className="text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,.6)] text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight">
                    {c.name}
                  </h3>
                  {c.tagline && (
                    <p
                      className="mt-1 text-white/85 text-sm sm:text-base lg:text-lg line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,.55)]">
                      {c.tagline}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* oklar */}
      {data.length > 1 && (
        <>
          <button
            onClick={() => scrollBy("prev")}
            aria-label="Önceki"
            className="hidden md:flex items-center justify-center absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white shadow-lg ring-1 ring-black/10 transition"
          >
            ‹
          </button>
          <button
            onClick={() => scrollBy("next")}
            aria-label="Sonraki"
            className="hidden md:flex items-center justify-center absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white shadow-lg ring-1 ring-black/10 transition"
          >
            ›
          </button>
        </>
      )}

      {/* dots */}
      {data.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {data.map((_, i) => {
            const on = i === active;
            return (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goto(i)}
                className={`h-1.5 rounded-full transition-all ${
                  on ? "w-7 bg-black/75" : "w-3 bg-black/25 hover:bg-black/40"
                }`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

declare global {
  interface CSSStyleDeclaration {
    WebkitMaskImage?: string;
  }
}
