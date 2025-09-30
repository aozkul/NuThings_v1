"use client";
import {KEY} from "./CookieConsent";

export default function ReopenConsentButton() {
    const reopen = () => {
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(KEY);
                window.dispatchEvent(new Event("open-cookie-consent"));
            }
        } catch {
        }
    };
    return (
        <button onClick={reopen} className="mt-3 px-4 py-2 rounded-xl border">
            Einstellungen ändern
        </button>
    );
}
