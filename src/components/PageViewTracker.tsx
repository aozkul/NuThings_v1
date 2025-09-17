"use client";

import {usePathname, useSearchParams} from "next/navigation";
import {useEffect} from "react";

export default function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.gtag !== "function") return;
        const path = searchParams?.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;

        window.gtag("event", "page_view", {
            page_path: path,
        });
    }, [pathname, searchParams]);

    return null;
}
