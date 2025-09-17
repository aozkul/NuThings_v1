"use client";

import {useEffect} from "react";

type Props = {
  /** Eski kullanım: <TrackView productId="..."/> */
  productId?: string;
  /** Yeni/alternatif kullanım: <TrackView id="..." slug="..."/> */
  id?: string;
  slug?: string | null;
  /** İstersen ekstra alanlar gönderebilirsin */
  meta?: Record<string, any>;
};

/**
 * Görünmez izleme bileşeni.
 * - Geriye dönük uyumluluk: hem `productId` hem `id` (ve opsiyonel `slug`) kabul eder.
 * - /api/track-view varsa oraya best-effort beacon atar; yoksa sessizce devam eder.
 */
export default function TrackView({productId, id, slug, meta}: Props) {
  useEffect(() => {
    const pid = productId ?? id;
    if (!pid) return;

    try {
      const payload = {
        productId: pid,
        slug: slug ?? undefined,
        path:
          typeof window !== "undefined" ? window.location.pathname : undefined,
        ref:
          typeof document !== "undefined" ? document.referrer : undefined,
        ts: Date.now(),
        ...meta,
      };

      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });
        (navigator as any).sendBeacon("/api/track-view", blob);
      } else {
        fetch("/api/track-view", {
          method: "POST",
          headers: {"content-type": "application/json"},
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {
        });
      }
    } catch {
      /* no-op */
    }
  }, [productId, id, slug, meta]);

  return null;
}
