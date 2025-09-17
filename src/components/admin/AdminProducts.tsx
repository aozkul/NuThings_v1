"use client";
import {useEffect, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";
import {Product} from "@/src/lib/types";

export default function AdminProducts() {
  const [list, setList] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Partial<Product>>({name: "", price: 0});
  const load = async () => {
    const {data} = await supabase.from("products").select("*").order("name");
    setList(data || []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    await supabase.from("products").insert({...draft, slug: (draft.name || '').toLowerCase().replace(/\s+/g, '-')});
    setDraft({name: "", price: 0});
    load();
  };
  const del = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <div className="card p-4">
          <h3 className="font-medium mb-2">Ürünler</h3>
          <ul className="divide-y">
            {list.map(p => (
              <li key={p.id} className="py-2 flex items-center gap-3">
                <img src={p.image_url || "/placeholder.png"} alt={p.image_alt ?? p.name}
                     className="h-12 w-16 object-cover rounded"/>
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-600">{typeof p.price === "number" ? p.price.toFixed(2) : ""} €
                  </div>
                </div>
                <button className="text-red-600" onClick={() => del(p.id)}>Sil</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <div className="card p-4">
          <h3 className="font-medium mb-2">Yeni Ürün</h3>
          <label className="block text-sm">Başlık</label>
          <input className="w-full border rounded px-3 py-2 mb-2" value={draft.name || ""}
                 onChange={e => setDraft(d => ({...d, name: e.target.value}))}/>
          <label className="block text-sm">Fiyat (€)</label>
          <input type="number" step="0.01" className="w-full border rounded px-3 py-2 mb-2" value={draft.price || 0}
                 onChange={e => setDraft(d => ({...d, price: Number(e.target.value)}))}/>
          <label className="block text-sm">Görsel URL</label>
          <input className="w-full border rounded px-3 py-2 mb-2" value={draft.image_url || ""}
                 onChange={e => setDraft(d => ({...d, image_url: e.target.value}))}/>
          <button onClick={save} className="w-full mt-2 px-3 py-2 rounded bg-black text-white">Kaydet</button>
        </div>
      </div>
    </div>
  );
}
