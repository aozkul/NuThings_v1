"use client";
import {useEffect, useMemo, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";

type Daily = { day: string; count: number };
type Bucket = { key: string; count: number };
type Totals = { total: number; uniques: number };

type RawRow = {
  ts: string;
  country?: string;
  path?: string;
  ip_hash?: string;
  user_agent?: string;
  referrer?: string;
};

// ---------- yardımcılar ----------
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const fmtShort = (s: string, max = 16) => (s.length > max ? s.slice(0, max - 1) + "…" : s);
const niceTicks = (maxVal: number, steps = 4) => {
  const max = Math.max(1, maxVal);
  const raw = max / steps;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = Math.ceil(raw / pow) * pow;
  return Array.from({length: steps + 1}, (_, i) => i * nice);
};

const readablePath = (path: string): string => {
  if (path === "/" || path === "") return "Ana Sayfa";
  if (path.startsWith("/admin")) return "Yönetici Paneli";
  if (path.startsWith("/category/")) {
    const name = path.split("/category/")[1]?.replace(/[-_]/g, " ") || "";
    return `Kategori: ${name}`;
  }
  if (path.startsWith("/products/")) {
    const name = path.split("/products/")[1]?.replace(/[-_]/g, " ") || "";
    return `Ürün: ${name}`;
  }
  return path.replace(/^\//, "").replace(/[-_]/g, " ");
};

const countryLabel = (codeRaw: string): string => {
  const code = (codeRaw || "").toUpperCase();
  const map: Record<string, string> = {
    TR: "Türkiye 🇹🇷",
    DE: "Almanya 🇩🇪",
    US: "Amerika 🇺🇸",
    GB: "Birleşik Krallık 🇬🇧",
    FR: "Fransa 🇫🇷",
    ES: "İspanya 🇪🇸",
    IT: "İtalya 🇮🇹",
    NL: "Hollanda 🇳🇱",
    PL: "Polonya 🇵🇱",
    SE: "İsveç 🇸🇪",
    NO: "Norveç 🇳🇴",
    FI: "Finlandiya 🇫🇮",
    DK: "Danimarka 🇩🇰",
    CH: "İsviçre 🇨🇭",
    AT: "Avusturya 🇦🇹",
    BE: "Belçika 🇧🇪",
    PT: "Portekiz 🇵🇹",
    GR: "Yunanistan 🇬🇷",
    RO: "Romanya 🇷🇴",
    BG: "Bulgaristan 🇧🇬",
    CZ: "Çekya 🇨🇿",
    SK: "Slovakya 🇸🇰",
    HU: "Macaristan 🇭🇺",
    UA: "Ukrayna 🇺🇦",
    RU: "Rusya 🇷🇺",
    IE: "İrlanda 🇮🇪",
    CA: "Kanada 🇨🇦",
    MX: "Meksika 🇲🇽",
    BR: "Brezilya 🇧🇷",
    AR: "Arjantin 🇦🇷",
    AU: "Avustralya 🇦🇺",
    NZ: "Yeni Zelanda 🇳🇿",
    JP: "Japonya 🇯🇵",
    KR: "Kore 🇰🇷",
    CN: "Çin 🇨🇳",
    IN: "Hindistan 🇮🇳",
    SG: "Singapur 🇸🇬",
    HK: "Hong Kong 🇭🇰",
    SA: "Suudi Arabistan 🇸🇦",
    AE: "BAE 🇦🇪",
    QA: "Katar 🇶🇦",
    KW: "Kuveyt 🇰🇼",
    ZZ: "Bilinmiyor 🌐",
  };
  return map[code] || code;
};

const sourceLabel = (ref: string): string => {
  if (!ref) return "Doğrudan";
  const lower = ref.toLowerCase();
  if (lower.includes("google")) return "Google";
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("facebook")) return "Facebook";
  if (lower.includes("tiktok")) return "TikTok";
  try {
    const url = new URL(ref);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return ref.replace(/^https?:\/\//, "").split("/")[0] || "Diğer";
  }
};

const deviceFromUA = (uaRaw?: string): "Mobil" | "Tablet" | "Masaüstü" => {
  const ua = (uaRaw || "").toLowerCase();
  // çok kaba ama iş gören tespit
  if (/ipad|tablet/.test(ua)) return "Tablet";
  if (/mobile|iphone|android/.test(ua)) return "Mobil";
  return "Masaüstü";
};

// Yeni: ürün slug’ını okunur ada çevir
const productLabel = (slug: string) =>
  slug
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (c) => c.toLocaleUpperCase("tr-TR"));

// ---------- UI parçaları ----------
function Card({title, children}: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white shadow p-5">
      <h3 className="font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Stat({title, value}: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white shadow p-4 text-center">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

// ---------- Premium Line (alan + yumuşak eğri + grid + etiket) ----------
function PremiumLine({data, height = 260}: { data: Daily[]; height?: number }) {
  if (!data?.length) return <div className="text-sm text-neutral-500">Veri yok.</div>;

  const W = 900;
  const H = height;
  const PAD = 50;

  const maxY = Math.max(...data.map((d) => d.count), 1);
  const denom = data.length > 1 ? data.length - 1 : 1;

  const points = data.map((d, i) => {
    const x = PAD + (i * (W - 2 * PAD)) / denom;
    const y = H - PAD - (d.count / maxY) * (H - 2 * PAD);
    return {x, y, raw: d};
  });

  const toBezier = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const s = 0.2;
      const cp1x = p1.x + (p2.x - p0.x) * s;
      const cp1y = p1.y + (p2.y - p0.y) * s;
      const cp2x = p2.x - (p3.x - p1.x) * s;
      const cp2y = p2.y - (p3.y - p1.y) * s;
      d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }
    return d.join(" ");
  };

  const pathLine = toBezier(points);
  const pathArea = pathLine + ` L ${PAD + (W - 2 * PAD)} ${H - PAD} L ${PAD} ${H - PAD} Z`;
  const ticks = niceTicks(maxY, 4);

  return (
    <div className="relative w-full">
      <svg className="w-full" height={H} viewBox={`0 0 ${W} ${H}`} role="img">
        <defs>
          <linearGradient id="ln-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.20"/>
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00"/>
          </linearGradient>
        </defs>

        {ticks.map((t, i) => {
          const y = H - PAD - (t / Math.max(1, ticks.at(-1)!)) * (H - 2 * PAD);
          return (
            <g key={i}>
              <line x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="#eef2f7"/>
              <text x={PAD - 8} y={y + 4} fontSize="10" fill="#6b7280" textAnchor="end">
                {t}
              </text>
            </g>
          );
        })}

        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#d1d5db"/>
        <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="#d1d5db"/>

        <path d={pathArea} fill="url(#ln-grad)"/>
        <path d={pathLine} fill="none" stroke="#2563eb" strokeWidth={2.5}/>

        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2563eb"/>)}

        {(() => {
          const last = points.at(-1)!;
          return (
            <g>
              <rect
                x={clamp(last.x - 24, PAD, W - 80)}
                y={last.y - 28}
                width="48"
                height="18"
                rx="6"
                fill="#111827"
              />
              <text
                x={clamp(last.x, PAD + 24, W - 56)}
                y={last.y - 16}
                fontSize="10"
                fill="#fff"
                textAnchor="middle"
              >
                {last.raw.count}
              </text>
            </g>
          );
        })()}

        {data.slice(-8).map((d, i) => {
          const idx = data.length - 8 + i;
          const x = PAD + (idx * (W - 2 * PAD)) / denom;
          return (
            <text key={i} x={x} y={H - PAD + 16} fontSize="10" fill="#6b7280" textAnchor="middle">
              {d.day.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- Premium Bar (labelFormatter ile) ----------
function PremiumBars({
                       data,
                       color = "#3b82f6",
                       height = 260,
                       labelFormatter,
                     }: {
  data: Bucket[];
  color?: string;
  height?: number;
  labelFormatter?: (key: string) => string;
}) {
  if (!data?.length) return <div className="text-sm text-neutral-500">Veri yok.</div>;

  const W = 900;
  const H = height;
  const PAD = 50;
  const maxY = Math.max(...data.map((d) => d.count), 1);
  const ticks = niceTicks(maxY, 4);

  const gap = 8;
  const slot = (W - 2 * PAD) / data.length;
  const barW = Math.max(10, slot - gap);

  return (
    <div className="relative w-full">
      <svg className="w-full" height={H} viewBox={`0 0 ${W} ${H}`} role="img">
        <defs>
          <linearGradient id="bar-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.70"/>
          </linearGradient>
        </defs>

        {ticks.map((t, i) => {
          const y = H - PAD - (t / Math.max(1, ticks.at(-1)!)) * (H - 2 * PAD);
          return (
            <g key={i}>
              <line x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="#eef2f7"/>
              <text x={PAD - 8} y={y + 4} fontSize="10" fill="#6b7280" textAnchor="end">
                {t}
              </text>
            </g>
          );
        })}

        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#d1d5db"/>
        <line x1={PAD} y1={PAD / 2} x2={PAD} y2={H - PAD} stroke="#d1d5db"/>

        {data.map((d, i) => {
          const x = PAD + i * slot + (slot - barW) / 2;
          const h = (d.count / maxY) * (H - 2 * PAD);
          const y = H - PAD - h;
          const label = labelFormatter ? labelFormatter(d.key) : d.key;

          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx="8" fill="url(#bar-grad)"/>
              <text x={x + barW / 2} y={y - 6} fontSize="10" fill="#111827" textAnchor="middle">
                {d.count}
              </text>
              <text
                x={x + barW / 2}
                y={H - PAD + 18}
                fontSize="10"
                fill="#374151"
                textAnchor="middle"
              >
                {fmtShort(label, 18)}
              </text>
              <title>{label}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- Donut (Cihaz / Yeni-Geri) ----------
function Donut({
                 items,
                 colors,
                 height = 220,
                 totalLabel,
               }: {
  items: { key: string; count: number }[];
  colors: string[];
  height?: number;
  totalLabel?: string;
}) {
  if (!items?.length) return <div className="text-sm text-neutral-500">Veri yok.</div>;
  const W = 420;
  const H = height;
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 10;
  const ir = r * 0.60;

  const total = items.reduce((a, b) => a + b.count, 0);
  let acc = 0;

  const arcs = items.map((it, idx) => {
    const start = (acc / total) * Math.PI * 2;
    acc += it.count;
    const end = (acc / total) * Math.PI * 2;
    const large = end - start > Math.PI ? 1 : 0;
    const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end), ey = cy + r * Math.sin(end);
    const isx = cx + ir * Math.cos(end), isy = cy + ir * Math.sin(end);
    const iex = cx + ir * Math.cos(start), iey = cy + ir * Math.sin(start);
    const d = [
      `M ${sx} ${sy}`,
      `A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`,
      `L ${isx} ${isy}`,
      `A ${ir} ${ir} 0 ${large} 0 ${iex} ${iey}`,
      "Z",
    ].join(" ");
    return {d, color: colors[idx % colors.length], key: it.key, count: it.count};
  });

  return (
    <div className="w-full">
      <svg className="w-full" height={H} viewBox={`0 0 ${W} ${H}`} role="img">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color}>
            <title>{`${a.key}: ${a.count}`}</title>
          </path>
        ))}
        {/* merkez etiket */}
        <circle cx={cx} cy={cy} r={ir * 0.92} fill="white"/>
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" className="fill-black font-semibold">
          {total.toLocaleString()}
        </text>
        {totalLabel && (
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" className="fill-gray-500">
            {totalLabel}
          </text>
        )}
      </svg>
      {/* legend */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded" style={{background: colors[i % colors.length]}}/>
            <span className="text-neutral-600">{it.key}</span>
            <span className="ml-auto tabular-nums">{it.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Sayfa ----------
export default function AdminAnalytics() {
  const [daily, setDaily] = useState<Daily[]>([]);
  const [countries, setCountries] = useState<Bucket[]>([]);
  const [pages, setPages] = useState<Bucket[]>([]);
  const [totals, setTotals] = useState<Totals>({total: 0, uniques: 0});

  // yeni grafikler için ham kayıtlar
  const [raw, setRaw] = useState<RawRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const sinceDays = 30;

        const [r1, r2, r3, r4, rRaw] = await Promise.all([
          supabase.rpc("analytics_daily", {p_days: sinceDays}),
          supabase.rpc("analytics_by_country", {p_limit: 12}),
          supabase.rpc("analytics_by_path", {p_limit: 12}),
          supabase.rpc("analytics_totals"),
          // ham veriler (ts, path, user_agent, referrer, ip_hash)
          supabase.rpc("analytics_raw_since", {p_days: sinceDays}),
        ]);

        if (r1.error || r2.error || r3.error || r4.error || (rRaw as any).error) {
          const msg = [r1.error?.message, r2.error?.message, r3.error?.message, r4.error?.message, (rRaw as any)?.error?.message]
            .filter(Boolean)
            .join(" | ");
          throw new Error(msg || "RPC/SELECT");
        }

        setDaily((r1.data || []) as Daily[]);
        setCountries((r2.data || []) as Bucket[]);
        setPages((r3.data || []) as Bucket[]);
        setTotals(((r4.data && r4.data[0]) || {total: 0, uniques: 0}) as Totals);
        setRaw(((rRaw as any).data || []) as RawRow[]);
      } catch (e: any) {
        setError(e.message || "Hata");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- türetilmiş metrikler (ham veriden) ----
  const devicePie = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of raw) {
      const d = deviceFromUA(r.user_agent);
      counts.set(d, (counts.get(d) || 0) + 1);
    }
    const items = Array.from(counts.entries()).map(([key, count]) => ({key, count}));
    return items.sort((a, b) => b.count - a.count);
  }, [raw]);

  const hourBars = useMemo(() => {
    const arr = Array.from({length: 24}, (_, h) => ({key: String(h).padStart(2, "0"), count: 0}));
    for (const r of raw) {
      // tarayıcı local saatine göre grupla
      const h = new Date(r.ts).getHours();
      arr[h].count += 1;
    }
    return arr;
  }, [raw]);

  const sourceBars = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of raw) {
      const s = sourceLabel(r.referrer || "");
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    const items = Array.from(counts.entries()).map(([key, count]) => ({key, count}));
    return items.sort((a, b) => b.count - a.count).slice(0, 12);
  }, [raw]);

  const newVsReturning = useMemo(() => {
    const perUser = new Map<string, number>();
    for (const r of raw) {
      if (!r.ip_hash) continue;
      perUser.set(r.ip_hash, (perUser.get(r.ip_hash) || 0) + 1);
    }
    let returning = 0, newbie = 0;
    for (const c of perUser.values()) {
      if (c > 1) returning++; else newbie++;
    }
    return [
      {key: "Yeni", count: newbie},
      {key: "Geri Dönen", count: returning},
    ];
  }, [raw]);

  // ✅ Yeni: En Çok Ziyaret Edilen Ürünler (slug üzerinden, Top 10)
  const topProducts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of raw) {
      const p = (r.path || "").split("?")[0];
      if (p.startsWith("/products/")) {
        const slug = p.slice("/products/".length).split("/")[0];
        if (slug) m.set(slug, (m.get(slug) || 0) + 1);
      }
    }
    return Array.from(m, ([key, count]) => ({key, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [raw]);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Ziyaret Analitiği</h2>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          Hata: {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Toplam Ziyaret" value={totals.total.toLocaleString()}/>
        <Stat title="Tekil Ziyaretçi" value={totals.uniques.toLocaleString()}/>
        <Stat title="Ülke Sayısı" value={countries.length.toString()}/>
        <Stat title="Sayfa (Top 12)" value={pages.length.toString()}/>
      </div>

      {/* mevcut 3 grafik */}
      <Card title="Son 30 Gün Günlük Ziyaret">
        <PremiumLine data={daily}/>
      </Card>

      <Card title="Ülkelere Göre Ziyaretler (Top 12)">
        <PremiumBars data={countries} color="#10b981" labelFormatter={(k) => countryLabel(k)}/>
      </Card>

      <Card title="En Çok Ziyaret Alan Sayfalar (Top 12)">
        <PremiumBars data={pages} color="#3b82f6" labelFormatter={(k) => readablePath(k)}/>
      </Card>

      {/* 🔥 Yeni ürün grafiği */}
      <Card title="En Çok Ziyaret Edilen Ürünler (Top 10, Son 30 Gün)">
        <PremiumBars data={topProducts} color="#8b5cf6" labelFormatter={(slug) => productLabel(slug)}/>
      </Card>

      {/* mevcut ek grafikler */}
      <Card title="Cihaz Dağılımı">
        <Donut
          items={devicePie}
          colors={["#0ea5e9", "#a78bfa", "#34d399"]}
          totalLabel="Ziyaret"
        />
      </Card>

      <Card title="Günün Saatlerine Göre Trafik">
        <PremiumBars
          data={hourBars}
          color="#f59e0b"
          labelFormatter={(k) => `${k}:00`}
        />
      </Card>

      <Card title="Trafik Kaynakları (Referrer)">
        <PremiumBars
          data={sourceBars}
          color="#ef4444"
          labelFormatter={(k) => k}
        />
      </Card>

      <Card title="Yeni vs Geri Dönen Ziyaretçiler">
        <Donut
          items={newVsReturning}
          colors={["#60a5fa", "#111827"]}
          totalLabel="Ziyaretçi"
        />
      </Card>
    </div>
  );
}
