// src/components/ReviewForm.tsx
"use client";

import {useState} from "react";
import {useI18n} from "@/src/i18n/provider";

export default function ReviewForm() {
    const {messages} = useI18n();
    const T = (k: string, fb?: string) => messages?.common?.[k] ?? fb ?? k;

    const [name, setName] = useState("");
    const [rating, setRating] = useState<number | "">("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [info, setInfo] = useState<string | null>(null);

    const submit = async () => {
        if (!message.trim()) {
            setInfo(T("mesaj", "Message"));
            return;
        }
        setBusy(true);
        setInfo(null);
        try {
            // ✅ SENİN PROJE: /api/reviews/submit
            const res = await fetch("/api/reviews/submit", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: name || null,
                    rating: rating === "" ? null : Number(rating),
                    message: message.trim(),
                }),
            });

            if (res.status === 429) {
                setInfo(
                    T(
                        "aynı_tarayıcı_oturumu_çerez_için_günde_1_yorum_sınırı_vardır",
                        "One review per day per browser session."
                    )
                );
            } else if (!res.ok) {
                const t = await res.text();
                setInfo(T("yorumlar_yüklenemedi", "Failed to submit") + ": " + (t || res.statusText));
            } else {
                setInfo(T("tüm_yorumlar", "All Reviews")); // “Teşekkürler!” yerine basit onay
                setMessage("");
                setRating("");
            }
        } catch (e: any) {
            setInfo(T("yorumlar_yüklenemedi", "Failed to submit"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">{T("adınız", "Your name")}</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                        placeholder={T("adınız", "Your name")}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">{T("puan", "Rating")}</label>
                    <select
                        value={rating}
                        onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                    >
                        <option value="">{T("puan_opsiyonel", "Rating (optional)")}</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">{T("mesaj", "Message")}</label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                    placeholder={T("mesaj", "Message")}
                />
            </div>

            <div className="flex items-center gap-3 pt-1">
                <button
                    onClick={submit}
                    disabled={busy || !message.trim()}
                    className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50 text-sm font-medium"
                >
                    {busy ? T("yükleniyor", "Loading…") : T("kaydet", "Submit")}
                </button>
                {info && <span className="text-sm text-neutral-600">{info}</span>}
            </div>
        </div>
    );
}
