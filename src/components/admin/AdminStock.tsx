"use client";
import React, {useEffect, useMemo, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";
import Link from "next/link";

type Cat = { id: string; name: string };
type Prod = {
  id: string;
  name: string;
  slug?: string | null;
  stock?: number | null;
  price?: number | null;
  category_id?: string | null;
  categories?: { name?: string | null } | null;
};

export default function AdminStock(){
  const [cats, setCats] = useState<Cat[]>([]);
  const [rows, setRows] = useState<Prod[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const catRes = await supabase.from("categories").select("id,name").order("name");
      const prodRes = await supabase
        .from("products")
        .select("id,name,slug,price,stock,category_id,categories(name)")
        .order("name");
      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;
      setCats((catRes.data as any as Cat[]) || []);
      setRows((prodRes.data as any as Prod[]) || []);
    } catch (e: any) {
      setStatus(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const okCat = !cat || r.category_id === cat;
      const text = (r.name || "") + " " + (r.slug || "");
      const okQ = !q || text.toLowerCase().includes(q.toLowerCase());
      return okCat && okQ;
    });
  }, [rows, q, cat]);

  async function saveStock(p: Prod, next: number){
    setStatus(null);
    const { error } = await supabase.from("products").update({ stock: next }).eq("id", p.id);
    if (error) {
      setStatus(error.message);
      return;
    }
    setRows(prev => prev.map(x => x.id === p.id ? {...x, stock: next} : x));
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Stok Yönetimi</h1>
        <div className="grow" />
        <Link href="/admin" className="text-sm underline">← Admin</Link>
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Ürün adı / slug ara..."
          className="rounded-xl border px-3 py-2"
        />
        <select
          value={cat}
          onChange={(e)=>setCat(e.target.value)}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">Tüm kategoriler</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={load} className="rounded-xl border px-3 py-2">Yenile</button>
      </div>

      {status && <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{status}</div>}

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
              <th>Ürün</th>
              <th>Kategori</th>
              <th>Fiyat (€)</th>
              <th>Stok</th>
              <th className="w-64">İşlem</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2">
            {loading ? (
              <tr><td colSpan={5}>Yükleniyor...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}>Kayıt yok.</td></tr>
            ) : filtered.map(p => {
              const st = typeof p.stock === "number" ? p.stock : 0;
              const [draft, setDraft] = [st, null]; // placeholder not used; we'll do inline controls
              return (
                <tr key={p.id} className="border-t">
                  <td className="max-w-[320px]">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-neutral-500">{p.slug}</div>
                  </td>
                  <td>{p.categories?.name || "-"}</td>
                  <td>{typeof p.price === "number" ? p.price.toFixed(2) : "-"}</td>
                  <td>
                    <span className={`inline-block rounded-full px-2 py-0.5 ${st>0?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
                      {st}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={()=>saveStock(p, Math.max(0, st-10))} className="rounded-lg border px-2 py-1">-10</button>
                      <button onClick={()=>saveStock(p, Math.max(0, st-1))} className="rounded-lg border px-2 py-1">-1</button>
                      <input
                        type="number"
                        defaultValue={st}
                        onBlur={(e)=>{
                          const v = Math.max(0, parseInt(e.target.value||"0", 10));
                          if (v !== st) saveStock(p, v);
                        }}
                        className="w-20 rounded-lg border px-2 py-1"
                      />
                      <button onClick={()=>saveStock(p, st+1)} className="rounded-lg border px-2 py-1">+1</button>
                      <button onClick={()=>saveStock(p, st+10)} className="rounded-lg border px-2 py-1">+10</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
