"use client";
import {KEY} from "./CookieConsent";

export default function CookieSettingsLink() {
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
            type="button"
            onClick={open}
            className="underline underline-offset-2 hover:opacity-80"
            aria-label="Cookie-Einstellungen öffnen"
        >
            Cookie-Einstellungen
        </button>
    );
}
