"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import { HeartIcon, HeartSolidIcon } from "@/src/components/Icons";

export default function LikeButton({ productId, initialLikes=0 }:{ productId: string; initialLikes?: number }){
    const dayKey = new Date().toDateString();
  const storageKey = useMemo(()=>`liked:${productId}:${dayKey}`,[productId, dayKey]);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [busy, setBusy] = useState(false);

    useEffect(()=>{
    if(typeof window !== "undefined"){
      setLiked(!!localStorage.getItem(storageKey));
    }
  }, [storageKey]);

  const toggle = async () => {
  if(busy) return;
  setBusy(true);
  try{
    if(!liked){
      // like
      setLiked(true);
      setLikes(v=>v+1);
      const { error } = await supabase.rpc("increment_like", { pid: productId });
      if(error) throw error;
      if(typeof window !== "undefined"){ localStorage.setItem(storageKey, "1"); }
    }else{
      // unlike
      setLiked(false);
      setLikes(v=>Math.max(0, v-1));
      const { error } = await supabase.rpc("decrement_like", { pid: productId });
      if(error) throw error;
      if(typeof window !== "undefined"){ localStorage.removeItem(storageKey); }
    }
  }catch(err){
    console.error('like/unlike RPC failed', err);
    // rollback UI
    setLiked((prev)=>!prev);
    setLikes((v)=> Math.max(0, v + (liked ? 1 : -1)));
    alert("Beğeni kaydedilemedi. (Detay için konsolu kontrol edin)");
  }finally{
    setBusy(false);
  }
};

  return (
    <button onClick={toggle} aria-label="Beğen"
      className={"inline-flex items-center justify-center h-10 w-10 rounded-full border transition " + (liked ? "bg-red-50 border-red-200" : "hover:bg-neutral-50")}>
      {liked ? <HeartSolidIcon className="h-5 w-5 text-red-500"/> : <HeartIcon className="h-5 w-5"/>}
    </button>
  );
}
