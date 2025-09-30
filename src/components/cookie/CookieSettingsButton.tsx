"use client";
import {KEY} from "./CookieConsent";

export default function CookieSettingsButton() {
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
        <button
            onClick={open}
            className="px-4 py-1.5 rounded-xl border text-sm text-neutral-700 hover:bg-neutral-100 transition"
        >
            🍪 Cookie-Einstellungen
        </button>
    );
}
