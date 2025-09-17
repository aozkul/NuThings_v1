"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

type Stat = { product_id: string; product_title: string; clicks: number; likes: number };

export default function AdminMetrics(){
  const [rows, setRows] = useState<Stat[]>([]);
  useEffect(()=>{
    (async ()=>{
      // If you have RPC get_metrics in DB, it will populate table. Else, leave empty.
      const { data } = await supabase.rpc("get_metrics");
      setRows(data || []);
    })();
  },[]);

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">Metrics</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Ürün</th><th>Tıklama</th><th>Beğeni</th></tr></thead>
          <tbody>
            {rows.map(r=>(<tr key={r.product_id}><td>{r.product_title}</td><td>{r.clicks}</td><td>{r.likes}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
