"use client";

import {useState, useMemo, useRef, useEffect} from "react";

type Img = { id?: string | number; image_url: string; alt?: string };

export default function ProductGallery({
                                         mainUrl,
                                         mainAlt,
                                         images = [],
                                       }: {
  mainUrl?: string | null;
  mainAlt?: string | null;
  images?: Img[] | null;
}) {
  // Build list: main first + extra images (dedupe by url)
  const list = useMemo(() => {
    const arr: Img[] = [];
    if (mainUrl) arr.push({image_url: mainUrl, alt: mainAlt || undefined});
    (images || []).forEach((i) => arr.push({id: i.id, image_url: i.image_url, alt: i.alt}));
    return arr;
  }, [mainUrl, mainAlt, images]);

  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setActive(0), [list.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setActive((v) => Math.min(v + 1, Math.max(0, list.length - 1)));
      if (e.key === "ArrowLeft") setActive((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list.length]);

  if (!list.length) {
    return (
      <div className="border rounded-2xl bg-neutral-50 h-64 grid place-items-center text-neutral-500">
        Görsel bulunamadı
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden bg-white">
      {/* Main viewer */}
      <div className="relative bg-neutral-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list[active].image_url}
          alt={list[active].alt || "Ürün görseli"}
          className="w-full object-cover aspect-[4/3] md:aspect-[5/4] hover:opacity-99 transition"
          loading="eager"
          decoding="async"
        />
        {list.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Önceki görsel"
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Sonraki görsel"
              onClick={() => setActive((a) => Math.min(list.length - 1, a + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {list.length > 1 && (
        <div className="border-t bg-neutral-50/40">
          <div ref={trackRef} className="flex gap-2 overflow-x-auto p-3">
            {list.map((img, i) => (
              <button
                key={img.id || img.image_url || i}
                onClick={() => setActive(i)}
                className={`relative rounded-xl overflow-hidden border transition ${
                  i === active ? "ring-2 ring-black" : "opacity-80 hover:opacity-100"
                }`}
                aria-label={`Görsel ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.alt || ""}
                  className="h-16 w-20 md:h-20 md:w-24 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
