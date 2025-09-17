"use client";

import {useEffect, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";
import type {Category, Product} from "@/src/lib/types";

// Ürün tipini yerelde ALT ile genişletiyoruz (global tipi değiştirmeden)
type ProdWithAlt = Product & { image_alt?: string | null };

// Kategori satırı tipi: SEO ve görsel alanları dahil
type CatRow = Required<Pick<Category, "id" | "name">> & {
  position: number | null;
  image_url: string | null;
  image_alt: string | null;
  tagline: string | null;
  seo_title: string | null;
  seo_desc: string | null;
  product_count?: number;
  description: string | null;
};

const STORAGE_BUCKET = "product-images";
const CATEGORY_PREFIX = "category-images/";

export default function AdminCategories() {
  // KATEGORİ LİSTESİ
  const [cats, setCats] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(false);

  // YENİ / EDİT KATEGORİ FORM STATE
  const [editOpen, setEditOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CatRow | null>(null);

  const [fName, setFName] = useState("");
  const [fPosition, setFPosition] = useState<number | null>(0);
  const [fImage, setFImage] = useState("");
  const [fImageAlt, setFImageAlt] = useState("");
  const [fTagline, setFTagline] = useState("");
  const [fSeoTitle, setFSeoTitle] = useState(""); // ✅ SEO Title
  const [fSeoDesc, setFSeoDesc] = useState("");
  const [fCatDesc, setFCatDesc] = useState("");  // ✅ SEO Description

  // ÜRÜN ALTLİSTESİ (kısaltılmış)
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProdWithAlt[]>([]);
  const [pLoading, setPLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ---------- HELPERS ----------
  const sanitizeFileName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");

  const uploadToStorage = async (file: File, prefix: string) => {
    const safe = sanitizeFileName(file.name);
    const path = `${prefix}${Date.now()}-${safe}`;
    const {error} = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {contentType: file.type, upsert: false});
    if (error) throw error;
    const {data} = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl as string;
  };

  const loadCats = async () => {
    setLoading(true);
    try {
      const {data: clist, error} = await supabase
        .from("categories")
        .select("*") // ✅ kolon uyumsuzluğu sorunlarını önlemek için
        .order("position", {ascending: true});

      if (error) {
        console.error("Supabase categories.select error:", error);
        alert("Kategoriler alınamadı: " + (error.message || ""));
        throw error;
      }

      const catsBase = (clist || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        position: c.position ?? null,
        image_url: c.image_url || null,
        image_alt: c.image_alt || null,
        tagline: c.tagline ?? null,
        seo_title: c.seo_title ?? null,
        seo_desc: c.seo_desc ?? null,
        description: c.description ?? null,
      }));

      const {data: plist, error: pErr} = await supabase
        .from("products")
        .select("id,category_id");
      if (pErr) throw pErr;

      const counts = new Map<string, number>();
      (plist || []).forEach((p: any) => {
        if (!p.category_id) return;
        counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
      });

      const merged = catsBase.map((c) => ({
        ...c,
        product_count: counts.get(c.id) || 0,
      })) as CatRow[];

      setCats(merged);
    } catch (e) {
      console.error(e);
      // alert zaten üstte var; burada ekstra yok
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCats();
  }, []);

  const openNew = () => {
    setEditingCat(null);
    setFName("");
    setFPosition(0);
    setFImage("");
    setFImageAlt("");
    setFTagline("");
    setFSeoTitle(""); // reset
    setFSeoDesc("");  // reset
    setEditOpen(true);
    setFCatDesc("");
  };

  const openEdit = (c: CatRow) => {
    setEditingCat(c);
    setFName(c.name || "");
    setFPosition(c.position ?? 0);
    setFImage(c.image_url || "");
    setFImageAlt(c.image_alt || "");
    setFTagline(c.tagline || "");
    setFSeoTitle(c.seo_title || ""); // preload
    setFSeoDesc(c.seo_desc || "");   // preload
    setEditOpen(true);
    setFCatDesc((c as any).description || "");
  };

  const onPickCategoryImage = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToStorage(file, CATEGORY_PREFIX);
      setFImage(url);
    } catch (e) {
      console.error(e);
      alert("Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  };

  const saveCategory = async () => {
    if (!fName.trim()) {
      alert("Kategori adı zorunludur.");
      return;
    }
    if (uploading) {
      alert("Görsel yüklenmesi bitene kadar bekleyin.");
      return;
    }
    const payload: any = {
      name: fName.trim(),
      position: fPosition ?? null,
      image_url: fImage.trim() || null,
      image_alt: fImageAlt.trim() || null,
      tagline: fTagline.trim() || null,
      seo_title: fSeoTitle.trim() || null, // ✅ SEO
      seo_desc: fSeoDesc.trim() || null,
      description: fCatDesc.trim() || null, // ✅ SEO
    };
    if (editingCat?.id) payload.id = editingCat.id;

    const {error} = await supabase.from("categories").upsert(payload).select();
    if (error) {
      console.error(error);
      alert("Kategori kaydedilemedi.");
      return;
    }
    setEditOpen(false);
    await loadCats();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istiyor musun?")) return;
    const {error} = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Kategori silinemedi.");
      return;
    }
    await loadCats();
  };

  // Ürün alt liste (kısaltılmış — mevcut mantığını koru)
  const toggleExpand = async (id: string) => {
    if (expandedCatId === id) {
      setExpandedCatId(null);
      setProducts([]);
      return;
    }
    setExpandedCatId(id);
    setPLoading(true);
    try {
      const {data, error} = await supabase
        .from("products")
        .select("*")
        .eq("category_id", id);
      if (error) throw error;
      setProducts((data || []) as ProdWithAlt[]);
    } catch (e) {
      console.error(e);
      alert("Ürünler alınamadı.");
    } finally {
      setPLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Başlık + Yeni */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kategoriler</h3>
        <button
          onClick={openNew}
          className="rounded-lg bg-neutral-900 text-white px-3 py-2 hover:bg-neutral-800"
        >
          Yeni Kategori
        </button>
      </div>

      <div className="card p-4">
        {loading ? (
          <div className="text-sm text-neutral-600">Yükleniyor…</div>
        ) : cats.length === 0 ? (
          <div className="text-sm text-neutral-600">Henüz kategori yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
              <tr className="text-left text-neutral-600">
                <th className="py-2 pr-4">Sıra</th>
                <th className="py-2 pr-4">Ad</th>
                <th className="py-2 pr-4">Slider Yazısı</th>
                <th className="py-2 pr-4">Görsel</th>
                <th className="py-2 pr-4">Görsel Alt (SEO)</th>
                <th className="py-2 pr-4">Ürün</th>
                <th className="py-2 pr-4">İşlem</th>
              </tr>
              </thead>
              <tbody>
              {cats.map((c, i) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-center">{c.position ?? i + 1}</span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => alert("Sıralama tuşlarını kendi fonksiyonuna bağla")}
                          className="text-xs px-2 py-1 rounded border hover:bg-neutral-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => alert("Sıralama tuşlarını kendi fonksiyonuna bağla")}
                          className="text-xs px-2 py-1 rounded border hover:bg-neutral-50"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="font-medium">{c.name}</div>
                  </td>
                  <td className="py-2 pr-4 max-w-[260px]">
                    <div className="truncate text-neutral-700">
                      {c.tagline || <span className="text-neutral-400">—</span>}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    {c.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image_url}
                        alt={c.image_alt || c.name}
                        className="h-10 w-16 object-cover rounded border"
                      />
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="line-clamp-1">{c.image_alt || "—"}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="px-3 py-1.5 rounded border hover:bg-neutral-50"
                    >
                      {expandedCatId === c.id ? "Gizle" : "Göster"} ({c.product_count || 0})
                    </button>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1.5 rounded border hover:bg-neutral-50"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        className="px-3 py-1.5 rounded border text-red-600 hover:bg-red-50"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>

            {/* Expand alanı (kısaltılmış) */}
            {expandedCatId && (
              <div className="mt-4">
                {pLoading ? (
                  <div className="text-sm text-neutral-600">Ürünler yükleniyor…</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {products.map((p) => (
                      <div key={p.id} className="rounded border p-3 flex gap-3 items-center">
                        {/* ürün görseli alt */}
                        <img
                          src={(p as any).image_url || "/placeholder.png"}
                          alt={(p as any).image_alt || p.name}
                          className="h-16 w-20 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Yeni / Düzenle */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-[min(700px,95vw)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold">
                {editingCat ? "Kategoriyi Düzenle" : "Yeni Kategori"}
              </h4>
              <button
                onClick={() => setEditOpen(false)}
                className="rounded border px-2 py-1 hover:bg-neutral-50 text-sm"
              >
                Kapat
              </button>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Ad</label>
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Örn: Lokum"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Sıra (position)</label>
                  <input
                    type="number"
                    value={fPosition ?? 0}
                    onChange={(e) => setFPosition(Number(e.target.value))}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Örn: 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Görsel (URL)</label>
                  <input
                    value={fImage}
                    onChange={(e) => setFImage(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="https://.../image.jpg"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickCategoryImage(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                    {uploading && (
                      <span className="text-xs text-neutral-600">Yükleniyor…</span>
                    )}
                  </div>
                  {fImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fImage}
                      alt={fImageAlt || fName}
                      className="mt-2 h-20 w-28 object-cover rounded border"
                    />
                  )}
                </div>
              </div>

              {/* Görsel Alt (SEO) */}
              <div>
                <label className="block text-sm font-medium mb-1">Görsel Alt (SEO)</label>
                <input
                  value={fImageAlt}
                  onChange={(e) => setFImageAlt(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Örn: Fıstıklı lokum görseli"
                />
              </div>

              {/* Slider yazısı / Tagline */}
              <div>
                <label className="block text-sm font-medium mb-1">Tagline (Slider yazısı)</label>
                <input
                  value={fTagline}
                  onChange={(e) => setFTagline(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Örn: Doğadan Sofranıza"
                />
              </div>

              {/* Kategori Açıklaması */}
              <div>
                <label className="block text-sm font-medium mb-1">Açıklama</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 min-h-[90px]"
                  value={fCatDesc}
                  onChange={(e) => setFCatDesc(e.target.value)}
                  placeholder="Bu kategoride neler bulabileceğinizi kısaca anlatın…"
                />
              </div>

              {/* SEO Alanları */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">SEO Title</label>
                  <input
                    value={fSeoTitle}
                    onChange={(e) => setFSeoTitle(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Örn: Lokum | NuThings"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SEO Description</label>
                  <input
                    value={fSeoDesc}
                    onChange={(e) => setFSeoDesc(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Örn: Geleneksel lokum çeşitleri..."
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditOpen(false)}
                  className="px-3 py-2 rounded-lg border hover:bg-neutral-50"
                >
                  Vazgeç
                </button>
                <button
                  onClick={saveCategory}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
