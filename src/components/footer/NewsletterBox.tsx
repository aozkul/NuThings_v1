'use client';
import React, {useState} from 'react';
import {MailIcon} from '@/src/components/Icons';
import {useI18n} from '@/src/i18n/provider';

export default function NewsletterBox({
                                        compact = true,
                                        termsUrl = '/terms',
                                        privacyUrl = '/privacy',
                                      }: { compact?: boolean; termsUrl?: string; privacyUrl?: string }) {
  const {t} = useI18n();
  const T = (ns: string, key: string, fallback: string) => {
    const v = t(ns, key);
    return v === key ? fallback : v;
  };

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);
  const [msgKey, setMsgKey] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input[type="email"]') as HTMLInputElement | null;
    const email = input?.value?.trim();
    if (!email) return;
    setLoading(true);
    setOk(null);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          locale: typeof window !== 'undefined' ? document.documentElement.lang : 'de',
        }),
      });
      const j = await res.json();
      setOk(j.ok);
      setMsgKey(j.ok ? 'success' : 'error');
      if (j.ok && input) input.value = '';
    } catch {
      setOk(false);
      setMsgKey('network');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md md:ml-auto">
      <h3 className="text-lg md:text-xl font-semibold leading-tight">
        {T('footer', 'newsletter_title', 'Bültenimize Abone Olun!')}
      </h3>

      <p className="mt-1 text-sm text-neutral-600">
        {T('footer', 'newsletter_desc', 'Kampanyalarımızdan ve indirimlerimizden güncel olarak haberdar olun.')}
      </p>

      {/* Input + button */}
      <form onSubmit={onSubmit}
            className="mt-3 group flex items-center overflow-hidden rounded-full ring-1 ring-neutral-300 focus-within:ring-2 focus-within:ring-neutral-800">
        <input
          type="email"
          name="email"
          required
          placeholder={T('footer', 'email_placeholder', 'E-posta adresinizi yazın...')}
          className="w-full flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400"
          aria-label="Email"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label={T('footer', 'subscribe_aria', 'Abone ol')}
          className="h-full shrink-0 rounded-l-none bg-neutral-900 px-4 py-2.5 text-white transition
                     hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center gap-2">
            <MailIcon className="h-4 w-4"/>
            <span className="hidden sm:inline text-xs font-medium">
              {T('footer', 'subscribe_aria', 'Abone ol')}
            </span>
          </span>
        </button>
      </form>

      {/* Consent */}
      <label className="mt-2 flex items-start gap-2 text-[12px] leading-5 text-neutral-600">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-neutral-300"/>
        <span>
          <a href={termsUrl} className="font-medium text-red-600 hover:underline">
            {T('footer', 'consent_terms', 'Üyelik koşullarını')}
          </a>{' '}
          ve{' '}
          <a href={privacyUrl} className="font-medium text-red-600 hover:underline">
            {T('footer', 'consent_privacy', 'kişisel verilerimin')}
          </a>{' '}
          {T('footer', 'consent_rest', 'korunmasını kabul ediyorum.')}
        </span>
      </label>

      {/* Inline feedback */}
      {ok !== null && (
        <p className={`mt-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs
                       ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {T('footer', msgKey, ok ? 'Teşekkürler! E-postanız kaydedildi.' : 'Kayıt sırasında hata oluştu.')}
        </p>
      )}
    </div>
  );
}
