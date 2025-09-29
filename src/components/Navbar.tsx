"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useMemo, useRef, useState} from "react";
import {usePathname} from "next/navigation";
import {ShieldIcon} from "@/src/components/Icons";
import CartButton from "@/src/components/cart/CartButton";
import MiniCart from "@/src/components/cart/MiniCart";
import {IconBadge} from "@/src/components/IconBadge";
import LocaleSwitcher from "@/src/components/LocaleSwitcher";
import {supabase} from "@/src/lib/supabaseClient";
import type {Category} from "@/src/lib/types";

type Cat = Pick<Category, "id" | "name" | "slug"> & { position?: number | null };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<Cat[]>([]);
  const pathname = usePathname();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {data} = await supabase
        .from("categories")
        .select("id,name,slug,position")
        .order("position", {ascending: true});
      if (mounted && data) setCats(data as Cat[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (open) {
      html.classList.add("overflow-hidden");
      body.classList.add("overflow-hidden");
      setTimeout(() => firstLinkRef.current?.focus(), 0);
    } else {
      html.classList.remove("overflow-hidden");
      body.classList.remove("overflow-hidden");
      setTimeout(() => btnRef.current?.focus(), 0);
    }
    return () => {
      html.classList.remove("overflow-hidden");
      body.classList.remove("overflow-hidden");
    };
  }, [open]);

  const toggle = () => setOpen(v => !v);
  const close = () => setOpen(false);

  const [primaryCats, moreCats] = useMemo(() => {
    const first = cats.slice(0, 6);
    const rest = cats.slice(6);
    return [first, rest];
  }, [cats]);

  return (
    <>
      {/* HEADER */}
      <header className="w-full bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" aria-label="NuThings Home">
              <Image src="/logo.png" alt="NuThings" width={128} height={40} priority className="h-auto w-auto"/>
              <span
                className="ml-2 whitespace-nowrap text-base md:text-lg leading-none font-bold tracking-tight text-neutral-900">
                NuThings
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {primaryCats.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`}
                      className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors">
                  {c.name}
                </Link>
              ))}
              {moreCats.length > 0 && (
                <div className="group relative">
                  <button type="button"
                          className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                          aria-haspopup="true" aria-expanded="false">…
                  </button>
                  <div
                    className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-44 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg z-50">
                    {moreCats.map((c) => (
                      <Link key={c.id} href={`/category/${c.slug}`}
                            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Desktop actions: Admin → sağında Cart */}
            <div className="hidden md:flex items-center gap-3">
              <LocaleSwitcher/>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-2 py-2 rounded-xl border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              >
                <IconBadge bg="bg-violet-50" color="text-violet-600">
                  <ShieldIcon className="h-4 w-4"/>
                </IconBadge>
                <span className="text-sm font-medium">Admin</span>
              </Link>
              <CartButton/>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center">
              <button
                ref={btnRef}
                type="button"
                aria-label="Toggle menu"
                aria-expanded={open}
                aria-controls="mobile-nav"
                onClick={toggle}
                className={`inline-flex items-center justify-center rounded-xl p-2 border border-neutral-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-white transition ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              >
                {/* Hamburger icon */}
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SHEET */}
      <div className={`md:hidden fixed inset-0 z-[10000] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
           aria-hidden={!open}>
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
             onClick={close}/>
        {/* Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[86%] max-w-xs bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
          role="dialog" aria-modal="true">
          <nav id="mobile-nav" className="flex h-full flex-col p-4 gap-2 overflow-y-auto">
            {/* Başlık: Sol kapat, sağda Locale + Cart */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <button
                onClick={close}
                aria-label="Menüyü kapat"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <LocaleSwitcher/>
                {/* Sepete basınca menü kapansın */}
                <CartButton onClickBefore={close}/>
              </div>
            </div>

            {/* Kategoriler */}
            <div className="py-2">
              {cats.map((c, idx) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  ref={idx === 0 ? firstLinkRef : undefined}
                  onClick={close}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            {/* Admin */}
            <div className="mt-auto pt-2 border-t border-neutral-200">
              <Link
                href="/admin"
                onClick={close}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-medium shadow-sm hover:bg-neutral-50"
              >
                <IconBadge bg="bg-violet-50" color="text-violet-600">
                  <ShieldIcon className="h-4 w-4"/>
                </IconBadge>
                Admin
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* CART PORTAL */}
      <MiniCart/>
    </>
  );
}
