"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

type Row = { id: string; name: string; likes: number; clicks: number };

export default function AdminOverview(){
  const [counts, setCounts] = useState<{products:number; categories:number}>({products:0, categories:0});
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      const [{ count: pc }, { count: cc }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
      ]);
      setCounts({ products: pc||0, categories: cc||0 });

      // Try RPC first
      let data: Row[] = [];
      try{
        const rpc = await supabase.rpc("get_metrics");
        if(!rpc.error && rpc.data){
          data = (rpc.data as any[]).map((r:any)=>({ id: r.product_id, name: r.product_title || "Ürün", likes: Number(r.likes||0), clicks: Number(r.clicks||0) }));
        }
      }catch(_e){/* ignore */}

      // If RPC empty, try product_stats table
      if(!data.length){
        try{
          const { data: stats } = await supabase
            .from("product_stats")
            .select("product_id, likes, clicks, products(name)")
            .order("likes", { ascending: false })
            .limit(8);
          if(stats){
            data = stats.map((s:any)=>({ id: s.product_id, name: s.products?.name || "Ürün", likes: Number(s.likes||0), clicks: Number(s.clicks||0) }));
          }
        }catch(_e){/* ignore */}
      }

      // If still empty, derive from products (zeroed metrics)
      if(!data.length){
        const { data: prod } = await supabase.from("products").select("id,name").limit(8);
        data = (prod||[]).map((p:any)=>({ id: p.id, name: p.name, likes: 0, clicks: 0 }));
      }

      setRows(data);
      setLoading(false);
    })();
  },[]);

  const topLikes = useMemo(()=> [...rows].sort((a,b)=>b.likes-a.likes).slice(0,5), [rows]);
  const topClicks = useMemo(()=> [...rows].sort((a,b)=>b.clicks-a.clicks).slice(0,5), [rows]);
  const maxLike = Math.max(1, ...topLikes.map(r=>r.likes));
  const maxClick = Math.max(1, ...topClicks.map(r=>r.clicks));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Genel Bakış</h2>
          <span className="text-sm text-neutral-500">{loading ? "Yükleniyor..." : "Güncel"}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Stat label="Ürün" value={counts.products}/>
          <Stat label="Kategori" value={counts.categories}/>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">En Çok Beğenilen Ürünler</h2>
        <ChartBars rows={topLikes} max={maxLike} metric="likes"/>
      </div>

      <div className="card p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold mb-4">En Çok Ziyaret Edilen Ürünler</h2>
        <ChartBars rows={topClicks} max={maxClick} metric="clicks"/>
      </div>
    </div>
  );
}

function Stat({label, value}:{label:string; value:number}){
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-neutral-600">{label}</div>
      <div className="text-3xl font-serif mt-1">{value}</div>
    </div>
  );
}

function ChartBars({ rows, max, metric }:{ rows: Row[]; max: number; metric: "likes"|"clicks" }){
  if(!rows.length){
    return <div className="text-sm text-neutral-600">Veri bulunamadı.</div>;
  }
  return (
    <div className="space-y-3">
      {rows.map((r)=>{
        const pct = Math.max(3, Math.round((r[metric] / max) * 100));
        return (
          <div key={r.id}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="truncate">{r.name}</div>
              <div className="tabular-nums text-neutral-600">{r[metric]}</div>
            </div>
            <div className="h-3 rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-black to-neutral-500" style={{ width: pct + "%" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
