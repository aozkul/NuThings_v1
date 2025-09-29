"use client";
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";

export type CartItem = {
  id: string;          // product id
  slug?: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  stock?: number | null;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartCtx = createContext<CartState | undefined>(undefined);

const LS_KEY = "nutthings.cart.v1";

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function save(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

export function CartProvider({children}:{children: React.ReactNode}){
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(()=>{ setItems(load()); },[]);
  useEffect(()=>{ save(items); },[items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty: number = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === item.id);
      const max = (item.stock ?? Infinity);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = Math.min(max, next[idx].quantity + qty);
        next[idx] = {...next[idx], ...item, quantity: newQty};
        return next;
      } else {
        return [...prev, {...item, quantity: Math.min(max, qty)}];
      }
    });
    setOpen(true);
  },[]);

  const removeItem = useCallback((id: string)=> setItems(prev => prev.filter(p => p.id !== id)), []);
  const updateQty = useCallback((id: string, qty: number)=> setItems(prev => prev.map(p => p.id===id ? {...p, quantity: Math.max(1, Math.min(qty, p.stock ?? qty))} : p)), []);
  const clear = useCallback(()=> setItems([]), []);
  const openCart = useCallback(()=> setOpen(true),[]);
  const closeCart = useCallback(()=> setOpen(false),[]);
  const toggleCart = useCallback(()=> setOpen(o=>!o),[]);

  const total = useMemo(()=> items.reduce((s,i)=> s + i.price * i.quantity, 0),[items]);
  const count = useMemo(()=> items.reduce((s,i)=> s + i.quantity, 0),[items]);

  const value = useMemo(()=>({items, open, openCart, closeCart, toggleCart, addItem, removeItem, updateQty, clear, total, count}), [items, open, addItem, removeItem, updateQty, clear, openCart, closeCart, toggleCart, total, count]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(){
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
