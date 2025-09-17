"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

type Img = {
  id: string;
  url: string;
  image_alt: string | null;
  position: number | null;
};

export default function ProductImages({ productId }: { productId: string }) {
  const [images, setImages] = useState<Img[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const { data, error } = await supabase
      .from("product_images")
      .select("id,url,image_alt,position")
      .eq("product_id", productId)
      .order("position", { ascending: true });
    if (error) setError(error.message);
    setImages((data as any) || []);
  };

  useEffect(() => {
    if (productId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const maxPos = useMemo(
    () => (images.length ? Math.max(...images.map((i) => i.position || 0)) : -1),
    [images]
  );

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const path = `${productId}/${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        const publicUrl = pub?.publicUrl;

        const { error: insErr } = await supabase.from("product_images").insert({
          product_id: productId,
          url: publicUrl,
          image_alt: null,
          position: maxPos + 1,
        } as any);
        if (insErr) throw insErr;
      }
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const updateAlt = async (id: string, alt: string) => {
    setError(null);
    const { error } = await supabase.from("product_images").update({ image_alt: alt }).eq("id", id);
    if (error) setError(error.message);
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = images.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const cur = images[idx];
    const swap = images[idx + dir];
    if (!swap) return;

    setBusy(true);
    try {
      const a = supabase.from("product_images").update({ position: swap.position }).eq("id", cur.id);
      const b = supabase.from("product_images").update({ position: cur.position }).eq("id", swap.id);
      const [ra, rb] = await Promise.all([a, b]);
      if (ra.error) throw ra.error;
      if (rb.error) throw rb.error;
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (img: Img) => {
    setBusy(true);
    setError(null);
    try {
      const m = img.url.match(/\/product-images\/(.*)$/);
      const storagePath = m ? m[1] : null;
      if (storagePath) {
        await supabase.storage.from("product-images").remove([storagePath]);
      }
      const { error } = await supabase.from("product_images").delete().eq("id", img.id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Ek Görseller</h4>
        <label className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            disabled={busy}
          />
          <span>{busy ? "Yükleniyor..." : "Görsel Ekle"}</span>
        </label>
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      {images.length ? (
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <li key={img.id} className="border rounded-xl overflow-hidden">
              <div className="aspect-square bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.image_alt || ""}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-2 space-y-2">
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="ALT (SEO)"
                  defaultValue={img.image_alt ?? ""}
                  onBlur={(e) => updateAlt(img.id, e.currentTarget.value)}
                />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="px-2 py-1 rounded border disabled:opacity-40"
                      disabled={i === 0 || busy}
                      onClick={() => move(img.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded border disabled:opacity-40"
                      disabled={i === images.length - 1 || busy}
                      onClick={() => move(img.id, 1)}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    className="px-2 py-1 rounded border text-red-600 disabled:opacity-40"
                    disabled={busy}
                    onClick={() => remove(img)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 text-sm text-neutral-600">Henüz ek görsel yok.</div>
      )}
    </div>
  );
}
