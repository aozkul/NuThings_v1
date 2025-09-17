"use client";

import React, {useMemo, useState} from "react";

interface ProductRow {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
}

export default function ClientCampaign({products}: { products: ProductRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState("Unsere Auswahl an neuen Produkten bei NuThings");
  const [intro, setIntro] = useState("Entdecken Sie die neuen Produkte, die wir für Sie ausgewählt haben!");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const canSend = selected.length > 0 && !loading;

  async function send() {
    if (!canSend) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/newsletter/campaign/send", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({productIds: selected, subject, intro}),
      });
      const j = await res.json();
      setResult(j);
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(
    () =>
      products.map((p) => (
        <tr key={p.id} className="border-b">
          <td className="py-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
            />
          </td>
          <td className="py-2">
            <div className="flex items-center gap-3">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name || ""}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 bg-neutral-200 rounded"/>
              )}
              <div className="flex flex-col">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-neutral-500">{p.price} €</span>
              </div>
            </div>
          </td>
        </tr>
      )),
    [products, selected]
  );

  return (
    <div className="p-6 max-w-3xl">
      <a
        href="/admin"
        className="inline-block mb-4 text-sm text-blue-600 hover:underline"
      >
        ⬅ Admin Paneline Dön
      </a>

      <h1 className="text-xl font-semibold mb-4">Newsletter Kampanya Oluştur</h1>

      <div className="mb-4 grid grid-cols-1 gap-3">
        <label className="block">
          <span className="text-sm text-neutral-600">Konu</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="E-posta konusu"
          />
        </label>
        <label className="block">
          <span className="text-sm text-neutral-600">Giriş metni (opsiyonel)</span>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            rows={3}
            placeholder="Kısa açıklama"
          />
        </label>
      </div>

      <div className="rounded border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
          <tr className="bg-neutral-50 text-left border-b">
            <th className="py-2 w-10"></th>
            <th className="py-2">Ürün</th>
          </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={send}
          disabled={!canSend}
          className="rounded bg-neutral-900 text-white px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Gönderiliyor..." : `Gönder (${selected.length})`}
        </button>
        {result && (
          <span className={`text-sm ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
            {result.ok
              ? `Başarılı: ${result.sent}/${result.total}`
              : `Hata: ${result.message || "bilinmeyen"}`}
          </span>
        )}
      </div>
    </div>
  );
}
