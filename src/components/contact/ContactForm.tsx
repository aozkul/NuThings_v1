// src/components/contact/ContactForm.tsx
"use client";

import {useEffect, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";
import {useI18n} from "@/src/i18n/provider";
import {MailIcon, PhoneIcon, InstagramIcon, TwitterIcon} from "@/src/components/Icons";

type SettingRow = { key: string; value: string | null };

export default function ContactForm() {
  const {messages} = useI18n();
  const T = (ns: any, k: string, fb?: string) => (ns?.[k] as string) ?? fb ?? k;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Admin ayarlarından iletişim verileri (KV şemaya göre)
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [twitterUrl, setTwitterUrl] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // KV şema: settings(key, value, ...)
        const KEYS = ["social_email", "social_phone", "social_instagram", "social_twitter"];
        const {data, error} = await supabase
          .from("settings")
          .select("key,value")
          .in("key", KEYS as any); // Supabase TS için as any

        if (error) throw error;
        if (!alive || !data) return;

        // key -> value map
        const map = new Map<string, string>();
        (data as SettingRow[]).forEach((row) => {
          const v = (row.value ?? "").trim();
          if (v) map.set(row.key, v);
        });

        setContactEmail(map.get("social_email") ?? "");
        setContactPhone(map.get("social_phone") ?? "");
        setInstagramUrl(map.get("social_instagram") ?? "");
        setTwitterUrl(map.get("social_twitter") ?? "");
      } catch {
        // sessiz geç
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setOk(null);
    try {
      const {error} = await supabase
        .from("contact_messages")
        .insert({name, email, phone, message});
      if (error) throw error;

      setOk(T(messages.common, "mesajınız_alındı_teşekkürler", "Mesajınız alındı. Teşekkürler!"));
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setOk(`${T(messages.common, "hata", "Hata:")} ${T(messages.common, "mesaj_gönderilemedi", "Mesaj gönderilemedi")}`);
    } finally {
      setBusy(false);
    }
  };

  const telHref = contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined;
  const mailHref = contactEmail ? `mailto:${contactEmail}` : undefined;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Form */}
      <form onSubmit={submit} className="md:col-span-2 card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ad Soyad */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {T(messages.common, "ad_soyad", "Ad Soyad")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder={T(messages.common, "ad_soyad", "Ad Soyad")}
            />
          </div>

          {/* E-posta */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {T(messages.common, "e_posta", "E-posta")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="you@example.com"
            />
          </div>

          {/* Telefon */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {T(messages.common, "telefon", "Telefon")}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="+49 ..."
            />
          </div>

          {/* Mesaj */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">
              {T(messages.common, "mesaj", "Mesaj")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder={T(messages.common, "mesaj", "Mesaj")}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
          >
            {busy ? T(messages.common, "yükleniyor", "Yükleniyor…") : T(messages.common, "kaydet", "Gönder")}
          </button>
          {ok && <span className="text-sm text-neutral-700">{ok}</span>}
        </div>
      </form>

      {/* Yan panel: İletişim Bilgileri (KV settings'ten) */}
      <aside className="card p-6">
        <h3 className="font-semibold mb-3">
          {T(messages.common, "i̇letişim_bilgileri", "İletişim Bilgileri")}
        </h3>
        <p className="text-sm text-neutral-700">NuThings</p>

        <div className="mt-3 space-y-2 text-sm">
          {/* E-posta */}
          {contactEmail && (
            <div className="flex items-center gap-2">
              <MailIcon className="h-4 w-4"/>
              <a href={mailHref}>{contactEmail}</a>
            </div>
          )}

          {/* Telefon */}
          {contactPhone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4"/>
              <a href={telHref}>{contactPhone}</a>
            </div>
          )}

          {/* Instagram */}
          {instagramUrl && (
            <div className="flex items-center gap-2">
              <InstagramIcon className="h-4 w-4"/>
              <a href={instagramUrl} target="_blank" rel="noreferrer">
                {T(messages.common, "instagram", "Instagram")}
              </a>
            </div>
          )}

          {/* Twitter / X */}
          {twitterUrl && (
            <div className="flex items-center gap-2">
              <TwitterIcon className="h-4 w-4"/>
              <a href={twitterUrl} target="_blank" rel="noreferrer">
                {T(messages.common, "twitter", "Twitter")}
              </a>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
