"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
type Row = { key: string; value: string };

const KEYS = ["parallax_title","parallax_message","about_text","social_instagram","social_twitter","social_email","social_phone"] as const;

export default function AdminSettings(){
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string|null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("settings").select("*").in("key", KEYS as any);
    if(error) setStatus(error.message);
    setRows((data||[]).map(r => ({ key: r.key, value: r.value || "" })));
  };

  useEffect(()=>{ load(); },[]);

  const save = async () => {
    setStatus("Kaydediliyor...");
    for(const r of rows){
      await supabase.from("settings").upsert({ key: r.key, value: r.value }, { onConflict: "key" });
    }
    setStatus("Kaydedildi");
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-4">Ayarlar</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((r, idx)=>(
          <label key={r.key} className="block">
            <div className="text-sm mb-1">{r.key}</div>
            <input type={r.key==="social_phone" ? "tel" : r.key==="social_email" ? "email" : "text"} placeholder={r.key==="social_phone" ? "+49 151 23456789" : r.key==="social_email" ? "info@nut-things.com" : ""} className="w-full border rounded-lg px-3 py-2" value={r.value} onChange={e=>{
              const v=[...rows]; v[idx]={...r, value:e.target.value}; setRows(v);
            }}/>
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-lg bg-black text-white">Kaydet</button>
        <button onClick={load} className="px-4 py-2 rounded-lg border">Yenile</button>
      </div>
      {status && <p className="mt-3 text-sm">{status}</p>}
    </div>
  );
}
