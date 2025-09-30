import React from "react";
import Link from "next/link";

export default function LegalShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <div className="rounded-3xl border bg-gradient-to-br from-neutral-50 to-white p-6 md:p-8 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-neutral-600">{subtitle}</p> : null}
          </div>
          <span className="hidden md:inline-block rounded-2xl border px-3 py-1 text-xs text-neutral-600 bg-white">Legal</span>
        </div>
        <nav className="mt-3 text-sm text-neutral-500">
          <Link href="/" className="hover:underline">Start</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">{title}</span>
        </nav>
      </div>

      <article className="space-y-6">
        {children}
      </article>
    </main>
  );
}
