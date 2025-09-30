"use client";
import {useEffect, useState} from "react";
import {KEY} from "./CookieConsent";

/** tek seferlik küçük dikkat çekme animasyonu için */
const HINT_KEY = "cookie-fab-hinted";

function CookieIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path
                d="M12 2a10 10 0 1 0 9.42 6.54 3 3 0 0 1-4.21-3.78A10 10 0 0 0 12 2Z"
                className="fill-current opacity-15"
            />
            <path
                d="M12 2a10 10 0 1 0 10 10 1 1 0 0 0-1.47-.88 2.99 2.99 0 0 1-4.32-3.36A1 1 0 0 0 14 6a4 4 0 0 1-4-4"
                className="stroke-current"
                strokeWidth="1.5"
                fill="none"
            />
            <circle cx="9" cy="9.5" r="1" className="fill-current"/>
            <circle cx="15" cy="10.5" r="1.2" className="fill-current"/>
            <circle cx="11.5" cy="14.5" r="1" className="fill-current"/>
        </svg>
    );
}

export default function CookieFab() {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        // İlk ziyaret ipucunu 1 kez göster
        if (typeof window !== "undefined" && !localStorage.getItem(HINT_KEY)) {
            setPulse(true);
            localStorage.setItem(HINT_KEY, "1");
            const t = setTimeout(() => setPulse(false), 2500);
            return () => clearTimeout(t);
        }
    }, []);

    const open = () => {
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(KEY);
                window.dispatchEvent(new Event("open-cookie-consent"));
            }
        } catch {
        }
    };

    return (
        <div
            className="
        fixed bottom-6 right-6 z-50 group
        pointer-events-none  /* sadece buton tıklanabilir olsun */
      "
        >
            {/* tooltip */}
            {/*    <div*/}
            {/*        className="*/}
            {/*  mb-2 mr-1 hidden group-hover:block group-focus-within:block*/}
            {/*  pointer-events-none select-none*/}
            {/*  text-xs px-2 py-1 rounded-lg*/}
            {/*  bg-neutral-900/90 text-white shadow*/}
            {/*  dark:bg-neutral-100/95 dark:text-black*/}
            {/*  translate-y-1 transition*/}
            {/*"*/}
            {/*        role="tooltip"*/}
            {/*    >*/}
            {/*        Cookie-Einstellungen*/}
            {/*    </div>*/}

            {/* buton */}
            <button
                type="button"
                onClick={open}
                aria-label="Cookie-Einstellungen"
                title="Cookie-Einstellungen"
                className={`
          pointer-events-auto
          h-14 w-14 md:h-16 md:w-16 rounded-full
          bg-white/85 text-neutral-900
          border border-white/60 ring-1 ring-black/5
          backdrop-blur-xl shadow-xl
          hover:shadow-2xl hover:-translate-y-0.5
          active:translate-y-0 transition
          dark:bg-neutral-900/85 dark:text-white dark:border-white/10 dark:ring-white/5
          relative overflow-hidden
        `}
            >
                {/* yumuşak gradient parlama */}
                <span
                    className="
            absolute inset-0 -z-10
            bg-[radial-gradient(60%_60%_at_30%_20%,rgba(255,255,255,.6),transparent)]
            dark:bg-[radial-gradient(60%_60%_at_30%_20%,rgba(255,255,255,.15),transparent)]
          "
                    aria-hidden
                />
                {/* pulse ipucu */}
                {pulse && (
                    <span
                        className="
              absolute inset-0 rounded-full
              animate-ping bg-current/10
              motion-reduce:hidden
            "
                        aria-hidden
                    />
                )}
                <CookieIcon className="mx-auto h-7 w-7 md:h-8 md:w-8"/>
            </button>
        </div>
    );
}
