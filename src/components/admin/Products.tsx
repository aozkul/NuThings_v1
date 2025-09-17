"use client";

import React, {useEffect, useMemo, useRef, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";
import ProductImages from "@/src/components/admin/ProductImages";

/** ------ Tipler ------ */
type Cat = { id: string; name: string };
type ProdRow = {
  id: string;
  name: string | null;
  category_id: string | null;
  price: number | null;
  image_url: string | null;
  image_alt: string | null;
  description: string | null;
  important_html: string | null;
  is_featured: boolean | null;
  seo_title?: string | null;
  seo_desc?: string | null;
  sort_order?: number | null;
};

/** ------ Storage ------ */
const STORAGE_BUCKET = "product-images";
const PRODUCT_PREFIX = "products/";

/** ------ Toolbar sabitleri (görseldeki gibi sade) ------ */
const SIZE_OPTIONS = [
  {v: "14px", l: "Küçük"},
  {v: "16px", l: "Normal"},
  {v: "18px", l: "Büyük"},
  {v: "20px", l: "Başlık"},
];
const FAMILY_OPTIONS = [
  {v: "inherit", l: "inherit"},
  {v: "Inter, system-ui, sans-serif", l: "Inter"},
  {v: "Arial, Helvetica, sans-serif", l: "Arial"},
  {v: "Georgia, serif", l: "Georgia"},
  {v: "Roboto, system-ui, sans-serif", l: "Roboto"},
];

/** ------ Component ------ */
export default function ProductsAdmin() {
  const [rows, setRows] = useState<ProdRow[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Kategori filtresi
  const [filterCatId, setFilterCatId] = useState<string>("");

  // Drawer/Form state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProdRow | null>(null);

  // Form alanları
  const [fName, setFName] = useState("");
  const [fCategoryId, setFCategoryId] = useState<string>("");
  const [fPrice, setFPrice] = useState<number | "">("");
  const [fImage, setFImage] = useState("");
  const [fAlt, setFAlt] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fSeoTitle, setFSeoTitle] = useState("");
  const [fSeoDesc, setFSeoDesc] = useState("");
  const [fFeatured, setFFeatured] = useState(false);
  const [fSort, setFSort] = useState<number | "">(0); // sort_order

  const [uploading, setUploading] = useState(false);

  // Önemli Bilgi (rich text)
  const impRef = useRef<HTMLDivElement>(null);
  const importantHTMLRef = useRef<string>("");

  // Toolbar selection helpers
  const savedRangeRef = useRef<Range | null>(null);
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0);
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };
  const exec = (cmd: string, val?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    onImpChange();
    saveSelection();
  };
  const applyInlineStyle = (style: "fontSize" | "color" | "fontFamily", value: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    (span.style as any)[style] = value;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    const nr = document.createRange();
    nr.selectNodeContents(span);
    nr.collapse(false);
    sel.addRange(nr);
    onImpChange();
    saveSelection();
  };

  // Kategori adı haritası
  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    cats.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cats]);

  // Filtrelenmiş satırlar
  const filteredRows = useMemo(() => {
    if (!filterCatId) return rows;
    return rows.filter((r) => r.category_id === filterCatId);
  }, [rows, filterCatId]);

  // Veri yükleme
  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("id, name").order("name", {ascending: true}),
        supabase
          .from("products")
          .select(
            "id, name, category_id, price, image_url, image_alt, description, important_html, is_featured, seo_title, seo_desc, sort_order"
          )
          .order("sort_order", {ascending: true})
          .order("name", {ascending: true}),
      ]);
      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;
      setCats((catRes.data as any as Cat[]) || []);
      setRows((prodRes.data as any as ProdRow[]) || []);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // --- Sıralama yardımcıları (kategori içinde hareket) ---
  const sortedByOrder = (categoryId?: string) =>
    (categoryId ? rows.filter((r) => r.category_id === categoryId) : rows)
      .slice()
      .sort(
        (a: any, b: any) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          (a.name || "").localeCompare(b.name || "")
      );

  const moveUp = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    const sorted = sortedByOrder(row?.category_id || undefined);
    const i = sorted.findIndex((r) => r.id === id);
    if (i <= 0) return;
    const a: any = sorted[i], b: any = sorted[i - 1];
    await swapOrders(a, b);
  };

  const moveDown = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    const sorted = sortedByOrder(row?.category_id || undefined);
    const i = sorted.findIndex((r) => r.id === id);
    if (i === -1 || i >= sorted.length - 1) return;
    const a: any = sorted[i], b: any = sorted[i + 1];
    await swapOrders(a, b);
  };

  const swapOrders = async (a: any, b: any) => {
    try {
      setStatus(null);
      const aOrder = a.sort_order ?? 0;
      const bOrder = b.sort_order ?? 0;
      // Çakışma engelleme: geçici değer
      let {error: e1} = await supabase.from("products").update({sort_order: 999999}).eq("id", a.id);
      if (e1) throw e1;
      let {error: e2} = await supabase.from("products").update({sort_order: aOrder}).eq("id", b.id);
      if (e2) throw e2;
      let {error: e3} = await supabase.from("products").update({sort_order: bOrder}).eq("id", a.id);
      if (e3) throw e3;
      await load();
    } catch (err: any) {
      setStatus(err.message || "Sıralama güncellenemedi.");
    }
  };

  const updateOrderInline = async (id: string, value: number) => {
    try {
      const {error} = await supabase.from("products").update({sort_order: value}).eq("id", id);
      if (error) throw error;
      await load();
    } catch (err: any) {
      setStatus(err.message || "Sıra değeri kaydedilemedi.");
    }
  };

  // Storage upload
  const uploadToStorage = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop();
    const path = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const {error: upErr} = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) throw upErr;
    const pub = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data;
    return pub?.publicUrl || "";
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    try {
      setUploading(true);
      const url = await uploadToStorage(file, PRODUCT_PREFIX);
      setFImage(url);
      setStatus(null);
    } catch (err: any) {
      setStatus(err.message || "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Yeni/Düzenle
  const onNew = () => {
    setEditing(null);
    setFName("");
    setFCategoryId("");
    setFPrice("");
    setFImage("");
    setFAlt("");
    setFDesc("");
    setFSeoTitle("");
    setFSeoDesc("");
    setFSort(0);
    importantHTMLRef.current = "";
    setFFeatured(false);
    setOpen(true);
    requestAnimationFrame(() => {
      if (impRef.current) impRef.current.innerHTML = "";
    });
  };

  const onEdit = (p: ProdRow) => {
    setEditing(p);
    setFName(p.name || "");
    setFCategoryId(p.category_id || "");
    setFPrice(p.price ?? "");
    setFImage(p.image_url || "");
    setFAlt(p.image_alt || "");
    setFDesc(p.description || "");
    setFSeoTitle((p.seo_title as string) || "");
    setFSeoDesc((p.seo_desc as string) || "");
    setFSort(p.sort_order ?? 0);
    importantHTMLRef.current = p.important_html || "";
    setFFeatured(!!p.is_featured);
    setOpen(true);
    requestAnimationFrame(() => {
      if (impRef.current) impRef.current.innerHTML = importantHTMLRef.current || "";
    });
  };

  const onSave = async () => {
    try {
      setStatus(null);
      const payload = {
        name: fName.trim() || null,
        category_id: fCategoryId || null,
        price: typeof fPrice === "number" ? fPrice : (fPrice === "" ? null : Number(fPrice)),
        image_url: fImage || null,
        image_alt: fAlt || null,
        description: fDesc || null,
        seo_title: fSeoTitle || null,
        seo_desc: fSeoDesc || null,
        is_featured: !!fFeatured,
        important_html: importantHTMLRef.current || null,
        sort_order: fSort === "" ? null : Number(fSort),
      };
      if (editing) {
        const {error} = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const {error} = await supabase.from("products").insert(payload as any);
        if (error) throw error;
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setStatus(e?.message || "Kaydedilemedi.");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Silmek istediğine emin misin?")) return;
    const {error} = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    await load();
  };

  const onImpChange = () => {
    importantHTMLRef.current = impRef.current?.innerHTML || "";
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      {/* Kart başlık + kategori filtresi + buton */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-4 bg-neutral-50">
          <h2 className="text-xl font-semibold">Ürünler</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Kategori:</label>
            <select
              value={filterCatId}
              onChange={(e) => setFilterCatId(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Tümü</option>
              {cats.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <button onClick={onNew} className="rounded-lg bg-black text-white px-4 py-2">
            Yeni Ürün
          </button>
        </div>

        <div className="p-4">
          {status && <div className="mb-3 text-sm text-red-600">{status}</div>}

          {loading ? (
            <div className="text-sm text-neutral-500">Yükleniyor…</div>
          ) : filteredRows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm table-fixed">
                <thead>
                <tr className="text-left text-neutral-600">
                  <th className="py-2 pr-4">Ürün</th>
                  <th className="py-2 pr-4 w-28 whitespace-nowrap">Kategori</th>
                  <th className="py-2 pr-4 w-20 whitespace-nowrap">Sıra</th>
                  <th className="py-2 pr-4 w-28 whitespace-nowrap">Sıralama</th>
                  <th className="py-2 pr-4 w-20 whitespace-nowrap">Fiyat</th>
                  <th className="py-2 pr-4 w-20 whitespace-nowrap">Görsel</th>
                  {/* Görsel Alt (SEO) sütunu kaldırıldı */}
                  <th className="py-2 pr-4 w-32 whitespace-nowrap">İşlem</th>
                </tr>
                </thead>
                <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-4">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-neutral-600 line-clamp-1 max-w-[40ch]">
                        {r.description ?? ""}
                      </div>
                    </td>

                    <td className="py-2 pr-4">
                        <span className="whitespace-nowrap">
                          {r.category_id ? catMap.get(r.category_id) || "-" : "-"}
                        </span>
                    </td>

                    {/* Sıra (inline) */}
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        className="w-14 border rounded px-2 py-1 text-sm"
                        value={(r as any).sort_order ?? 0}
                        onChange={(e) => updateOrderInline(r.id, Number(e.target.value))}
                      />
                    </td>

                    {/* Sıralama (↑ ↓) */}
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1">
                        <button
                          title="Yukarı"
                          className="h-8 w-8 border rounded flex items-center justify-center"
                          onClick={() => moveUp(r.id)}
                        >
                          ↑
                        </button>
                        <button
                          title="Aşağı"
                          className="h-8 w-8 border rounded flex items-center justify-center"
                          onClick={() => moveDown(r.id)}
                        >
                          ↓
                        </button>
                      </div>
                    </td>

                    {/* Fiyat */}
                    <td className="py-2 pr-4">
                      {typeof r.price === "number" ? `${r.price.toFixed(2)} €` : "-"}
                    </td>

                    {/* Görsel */}
                    <td className="py-2 pr-4">
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt=""
                          className="h-10 w-14 object-cover rounded mx-auto"
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* İşlem */}
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button className="px-2 py-1 rounded border" onClick={() => onEdit(r)}>
                          Düzenle
                        </button>
                        <button
                          className="px-2 py-1 rounded border text-red-600"
                          onClick={() => onDelete(r.id)}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">Liste boş.</div>
          )}
        </div>
      </div>

      {/* Drawer / Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)}/>
          <div
            className="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[820px] rounded-t-2xl md:rounded-2xl border bg-white shadow-2xl">
            <div className="p-4 space-y-4 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{editing ? "Ürünü Düzenle" : "Yeni Ürün"}</h3>
                <button className="text-sm text-neutral-600" onClick={() => setOpen(false)}>
                  Kapat
                </button>
              </div>

              {/* Ürün Adı */}
              <div>
                <label className="block text-sm font-medium mb-1">Ürün Adı</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Örn: Fıstıklı lokum - NuThings"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium mb-1">Açıklama</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Kısa ürün açıklaması..."
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                />
              </div>

              {/* Önemli Bilgi (Toolbar + Editor) — görseldeki gibi sade */}
              <div>
                <label className="block text-sm font-medium mb-1">Önemli Bilgi</label>

                {/* Toolbar (B, I, U + Normal + inherit + renk) */}
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <button className="px-2 py-1 border rounded" onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec("bold")}>B
                  </button>
                  <button className="px-2 py-1 border rounded" onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec("italic")}><i>İ</i></button>
                  <button className="px-2 py-1 border rounded" onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec("underline")}><u>U</u></button>

                  <select
                    className="border rounded px-2 py-1"
                    defaultValue="16px"
                    onMouseDown={(e) => e.preventDefault()}
                    onChange={(e) => applyInlineStyle("fontSize", e.target.value)}
                  >
                    {SIZE_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>

                  <select
                    className="border rounded px-2 py-1"
                    defaultValue="inherit"
                    onMouseDown={(e) => e.preventDefault()}
                    onChange={(e) => applyInlineStyle("fontFamily", e.target.value)}
                  >
                    {FAMILY_OPTIONS.map((o) => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>

                  <input
                    type="color"
                    className="border rounded w-10 h-8"
                    onMouseDown={(e) => e.preventDefault()}
                    onChange={(e) => applyInlineStyle("color", e.target.value)}
                  />
                </div>

                {/* Editor */}
                <div
                  ref={impRef}
                  contentEditable
                  onInput={onImpChange}
                  className="min-h-[120px] border rounded-lg px-3 py-2"
                  data-placeholder="Üründe öne çıkarılacak önemli bilgiler..."
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Bu alan üründe açıklamanın altında gösterilir.
                </p>
              </div>

              {/* Görsel + ALT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ana Görsel</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="https://…"
                    value={fImage}
                    onChange={(e) => setFImage(e.target.value)}
                  />
                  <div className="mt-2">
                    <input type="file" onChange={onPickFile} disabled={uploading}/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Görsel Alt (SEO)</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Örn: Fıstıklı lokum görseli"
                    value={fAlt}
                    onChange={(e) => setFAlt(e.target.value)}
                  />
                </div>
              </div>

              {/* Fiyat + Sıra + Öne Çıkan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Fiyat (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-28 border rounded-lg px-2 py-1"
                    placeholder="0.00"
                    value={fPrice as any}
                    onChange={(e) => setFPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Sıra</label>
                  <input
                    type="number"
                    className="w-24 border rounded-lg px-2 py-1"
                    placeholder="0"
                    value={fSort as any}
                    onChange={(e) => setFSort(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={fFeatured} onChange={(e) => setFFeatured(e.target.checked)}/>
                  Öne Çıkan
                </label>
              </div>

              {/* SEO Title + SEO Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SEO Title</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Örn: Fıstıklı Lokum 250g | NuThings"
                    value={fSeoTitle}
                    onChange={(e) => setFSeoTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SEO Description</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ürün için kısa açıklama…"
                    value={fSeoDesc}
                    onChange={(e) => setFSeoDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* Çoklu Görseller (varsa) */}
              {editing?.id && <ProductImages productId={editing.id}/>}

              {/* Kategori seçimi (form) */}
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select
                  value={fCategoryId}
                  onChange={(e) => setFCategoryId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">— Seçiniz —</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button className="px-3 py-2 rounded-lg border" onClick={() => setOpen(false)}>
                  İptal
                </button>
                <button
                  onClick={onSave}
                  disabled={uploading}
                  className="px-3 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CSS: contentEditable placeholder */}
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af; /* Tailwind: text-neutral-400 */
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
