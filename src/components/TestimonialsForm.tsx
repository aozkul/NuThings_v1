"use client";
import { useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export default function TestimonialsForm(){
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setOk(null);
    try{
      const { error } = await supabase.from("testimonials").insert({ name, rating, message });
      if(error) throw error;
      setOk("Teşekkürler! Yorumunuz kaydedildi.");
      setName(""); setRating(5); setMessage("");
      try{ await fetch(`/api/revalidate?path=/`, { method: 'POST', headers: { 'x-revalidate-secret': process.env.NEXT_PUBLIC_REVALIDATE_SECRET as string } }); }catch(e){}
    } catch(err:any){
      setOk(err?.message || "Bir hata oluştu.");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card p-4 md:p-6">
      <h3 className="font-semibold mb-3">Yorum Bırakın</h3>
      <label className="block text-sm">Adınız</label>
      <input className="w-full border rounded-lg px-3 py-2 mb-2" value={name} onChange={e=>setName(e.target.value)} required />
      <label className="block text-sm">Puan</label>
      <select className="w-full border rounded-lg px-3 py-2 mb-2" value={rating} onChange={e=>setRating(Number(e.target.value))}>
        {[5,4,3,2,1].map(n=>(<option key={n} value={n}>{n}</option>))}
      </select>
      <label className="block text-sm">Mesaj</label>
      <textarea className="w-full border rounded-lg px-3 py-2 mb-3 min-h-[100px]" value={message} onChange={e=>setMessage(e.target.value)} required />
      <button disabled={busy} className="px-4 py-2 rounded-lg bg-black text-white">{busy ? "Gönderiliyor..." : "Gönder"}</button>
      {ok && <p className="mt-3 text-sm">{ok}</p>}
    </form>
  );
}
