"use client";
import {useEffect} from "react";
import {usePathname, useSearchParams} from "next/navigation";

/**
 * Her oturumda, her path için 1 defa ziyaret kaydı gönderir.
 * Override / debug yoktur; ülke tespiti tamamen sunucudaki edge/headers'a göre yapılır.
 */
export default function VisitTracker() {
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw ?? '';
  const search = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = `visit_sent:${pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const path = search && search.toString() ? `${pathname}?${search.toString()}` : pathname;

    fetch("/api/analytics/visit", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({path}),
    }).catch(() => {
    });
  }, [pathname, search]);

  return null;
}
