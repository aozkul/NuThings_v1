// src/components/admin/Settings.tsx
"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {supabase} from "@/src/lib/supabaseClient";

/** ---------- DB Keys ---------- */
type Row = { key: string; value: string | null };

const RICH_KEYS = {
  title: "parallax_title",
  message: "parallax_message",
} as const;

// Title stilleri (BAĞIMSIZ)
const STYLE_KEYS_TITLE = {
  align: "parallax_title_align",
  font: "parallax_title_font_family",
  size: "parallax_title_size",              // PX
  color: "parallax_title_color",
  weight: "parallax_title_weight",
  lineHeight: "parallax_title_line_height",
  letterSpacing: "parallax_title_letter_spacing",
  shadow: "parallax_title_shadow",
} as const;

// Message stilleri (BAĞIMSIZ)
const STYLE_KEYS_MSG = {
  align: "parallax_message_align",
  font: "parallax_message_font_family",
  size: "parallax_message_size",            // PX
  color: "parallax_message_color",
  weight: "parallax_message_weight",
  lineHeight: "parallax_message_line_height",
  letterSpacing: "parallax_message_letter_spacing",
  shadow: "parallax_message_shadow",
} as const;

/** ---------- UI sabitleri ---------- */
const LOCAL_FONT_OPTIONS = [
  "inherit",
  "Inter, system-ui, sans-serif",
  "Arial, Helvetica, sans-serif",
  "Georgia, serif",
  "\"Times New Roman\", Times, serif",
  "Roboto, system-ui, sans-serif",
  "\"Playfair Display\", serif",
  "Merriweather, serif",
];

const GOOGLE_FONT_FAMILIES: Record<string, string> = {
  "Inter": "Inter, system-ui, sans-serif",
  "Roboto": "Roboto, system-ui, sans-serif",
  "Playfair Display": "\"Playfair Display\", serif",
  "Merriweather": "Merriweather, serif",
  "Lora": "Lora, serif",
  "Poppins": "Poppins, sans-serif",
  "Montserrat": "Montserrat, sans-serif",
  "Open Sans": "\"Open Sans\", sans-serif",
  "Raleway": "Raleway, sans-serif",
  "Lato": "Lato, sans-serif",
  "Source Sans 3": "\"Source Sans 3\", sans-serif",
  "Noto Serif": "\"Noto Serif\", serif",
  "Noto Sans": "\"Noto Sans\", sans-serif",
  "DM Sans": "\"DM Sans\", sans-serif",
  "Josefin Sans": "\"Josefin Sans\", sans-serif",
  "Oswald": "Oswald, sans-serif",
  "Nunito": "Nunito, sans-serif",
  "Libre Baskerville": "\"Libre Baskerville\", serif",
  "Bebas Neue": "\"Bebas Neue\", cursive",
  "Quicksand": "Quicksand, sans-serif",
  // Handwriting (cursive) set
  "Dancing Script": "\"Dancing Script\", cursive",
  "Great Vibes": "\"Great Vibes\", cursive",
  "Pacifico": "Pacifico, cursive",
  "Satisfy": "Satisfy, cursive",
  "Caveat": "Caveat, cursive",
  "Shadows Into Light": "\"Shadows Into Light\", cursive",
  "Amatic SC": "\"Amatic SC\", cursive",
  "Handlee": "Handlee, cursive",
  "Sacramento": "Sacramento, cursive",
  "Courgette": "Courgette, cursive",
  "Gloria Hallelujah": "\"Gloria Hallelujah\", cursive",
  "Nothing You Could Do": "\"Nothing You Could Do\", cursive"
};

const FONT_OPTIONS = Array.from(new Set([
  ...LOCAL_FONT_OPTIONS,
  ...Object.values(GOOGLE_FONT_FAMILIES),
])) as string[];


const WEIGHT_OPTIONS = ["100", "300", "400", "500", "600", "700", "800", "900"];
const LH_OPTIONS = ["1", "1.15", "1.25", "1.5", "1.75", "2"];
const LS_OPTIONS = ["-0.02em", "0", "0.02em", "0.05em", "0.1em"];

const SHADOW_MAP: Record<string, string> = {
  none: "",
  soft: "0 1px 2px rgba(0,0,0,.15)",
  glow: "0 0 8px rgba(255,215,0,.6)",
  hard: "0 2px 0 rgba(0,0,0,.5)",
};

// Eski 1–7 preset → px yükseltmesi
const PRESET_TO_PX: Record<string, string> = {
  "1": "12",
  "2": "14",
  "3": "16",
  "4": "18",
  "5": "24",
  "6": "32",
  "7": "36",
};

// ENV’den bucket ismi (varsa)
const ENV_BUCKET =
  (typeof process !== "undefined" &&
    (process as any).env?.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET) ||
  "";

/** ---------- Yardımcılar: bucket çıkarımı ---------- */
function parseBucketFromUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    const idx = u.pathname.indexOf("/storage/v1/object/");
    if (idx === -1) return null;
    const rest = u.pathname.slice(idx + "/storage/v1/object/".length);
    const parts = rest.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return parts[1] || null;
  } catch {
    return null;
  }
}

async function inferBucketNameFromDb(): Promise<string | null> {
  let {data: p} = await supabase
    .from("products")
    .select("image_url")
    .not("image_url", "is", null)
    .limit(1);
  const b1 = p && p[0]?.image_url ? parseBucketFromUrl(p[0].image_url as string) : null;
  if (b1) return b1;

  let {data: c} = await supabase
    .from("categories")
    .select("image_url")
    .not("image_url", "is", null)
    .limit(1);
  const b2 = c && c[0]?.image_url ? parseBucketFromUrl(c[0].image_url as string) : null;
  if (b2) return b2;

  return null;
}

/** ---------- Component ---------- */
export default function AdminSettings() {
// Load Google Fonts for admin preview (one consolidated request)
  useEffect(() => {
    try {
      const id = "admin-google-fonts";
      const weights = "wght@300;400;500;600;700;800;900";
      const famParams = Object.keys(GOOGLE_FONT_FAMILIES)
        .map((name) => `family=${encodeURIComponent(name)}:${weights}`)
        .join("&");
      const href = `https://fonts.googleapis.com/css2?${famParams}&display=swap`;

      let link = document.getElementById(id) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== href) link.href = href;
    } catch (err) {
      // Non-fatal: if Google Fonts fail to load, local fallbacks still work
      console.warn("Google Fonts preload failed:", err);
    }
  }, []);

  const [rows, setRows] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // BG upload durumu
  const [bgUploading, setBgUploading] = useState(false);
  const [bgUploadErr, setBgUploadErr] = useState<string | null>(null);

  // Kullanılacak bucket
  const [bucketName, setBucketName] = useState<string>(ENV_BUCKET || "");

  // Editör referansları
  const titleRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const titleHTMLRef = useRef<string>("");
  const msgHTMLRef = useRef<string>("");

  const ranges = useRef<{ title: Range | null; msg: Range | null }>({title: null, msg: null});

  /** ----- LOAD ----- */
  const load = async () => {
    setLoading(true);
    setStatus(null);

    if (!ENV_BUCKET) {
      const inferred = await inferBucketNameFromDb();
      if (inferred) setBucketName(inferred);
    }

    const {data, error} = await supabase.from("settings").select("key,value");
    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }
    const map: Record<string, string> = {};
    (data as Row[]).forEach(r => map[r.key] = r.value ?? "");

    // defaults — PX
    ensureDefaults(map, STYLE_KEYS_TITLE, {
      align: "center", font: "Inter, system-ui, sans-serif", size: "36", color: "#111111",
      weight: "700", lineHeight: "1.25", letterSpacing: "0", shadow: "none"
    });
    ensureDefaults(map, STYLE_KEYS_MSG, {
      align: "center", font: "Inter, system-ui, sans-serif", size: "24", color: "#111111",
      weight: "600", lineHeight: "1.5", letterSpacing: "0", shadow: "none"
    });

    map["parallax_bg_mode"] ??= "white";
    map["parallax_bg_url"] ??= "/parallax.jpg";
    map["parallax_overlay_opacity"] ??= "0.35";
    map["parallax_block_align"] ??= "center";
    map["parallax_underline_gradient"] ??= "none";
    map["parallax_panel_style"] ??= "none";
    map["social_email"] ??= "";
    map["social_instagram"] ??= "";
    map["social_phone"] ??= "";
    map["social_twitter"] ??= "";

    // Eski 1–7 → px
    [STYLE_KEYS_TITLE.size, STYLE_KEYS_MSG.size].forEach((k) => {
      const v = map[k];
      if (v && PRESET_TO_PX[v]) map[k] = PRESET_TO_PX[v];
    });

    setRows(map);

    queueMicrotask(() => {
      if (titleRef.current) titleRef.current.innerHTML = map[RICH_KEYS.title] || "";
      if (msgRef.current) msgRef.current.innerHTML = map[RICH_KEYS.message] || "";
      titleHTMLRef.current = map[RICH_KEYS.title] || "";
      msgHTMLRef.current = map[RICH_KEYS.message] || "";
      placeCaretEnd(titleRef.current);
      placeCaretEnd(msgRef.current);
      saveSelection("title");
      saveSelection("msg");
    });

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /** ----- SAVE ----- */
  const save = async () => {
    setSaving(true);
    setStatus(null);
    const latest = {...rows};
    latest[RICH_KEYS.title] = titleHTMLRef.current;
    latest[RICH_KEYS.message] = msgHTMLRef.current;

    const payload = Object.entries(latest).map(([key, value]) => ({key, value}));
    const {error} = await supabase.from("settings").upsert(payload, {onConflict: "key"});
    setStatus(error ? error.message : "Kaydedildi.");
    setSaving(false);
  };

  /** ----- helpers ----- */
  const getVal = (k: string) => rows[k] ?? "";
  const setVal = (k: string, v: string) => setRows(p => ({...p, [k]: v}));

  const placeCaretEnd = (node: HTMLElement | null) => {
    if (!node) return;
    const r = document.createRange();
    r.selectNodeContents(node);
    r.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(r);
    }
  };
  const saveSelection = (w: "title" | "msg") => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) ranges.current[w] = sel.getRangeAt(0);
  };
  const restoreSelection = (w: "title" | "msg") => {
    const sel = window.getSelection();
    const r = ranges.current[w];
    if (r && sel) {
      sel.removeAllRanges();
      sel.addRange(r);
    }
  };

  const runCmd = (w: "title" | "msg", fn: () => void) => {
    const ref = w === "title" ? titleRef : msgRef;
    ref.current?.focus();
    restoreSelection(w);
    fn();
    saveSelection(w);
    const html = ref.current?.innerHTML || "";
    if (w === "title") titleHTMLRef.current = html; else msgHTMLRef.current = html;
  };

  const applyInlineStyle = (w: "title" | "msg", style: Partial<CSSStyleDeclaration>) => {
    const ref = w === "title" ? titleRef : msgRef;
    ref.current?.focus();
    restoreSelection(w);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      saveSelection(w);
      return;
    }

    const frag = range.cloneContents();
    const wrap = document.createElement("span");
    Object.assign(wrap.style, style);
    wrap.appendChild(frag);
    range.deleteContents();
    range.insertNode(wrap);
    range.setStartAfter(wrap);
    range.collapse(true);
    saveSelection(w);

    const html = ref.current?.innerHTML || "";
    if (w === "title") titleHTMLRef.current = html; else msgHTMLRef.current = html;
  };

  const onEditorInput = (w: "title" | "msg") => (e: React.FormEvent<HTMLDivElement>) => {
    const html = (e.currentTarget as HTMLDivElement).innerHTML;
    if (w === "title") titleHTMLRef.current = html; else msgHTMLRef.current = html;
    saveSelection(w);
  };
  const onEditorSelectChange = (w: "title" | "msg") => () => saveSelection(w);

  // PX tabanlı box style
  const boxStyleFrom = (keys: typeof STYLE_KEYS_TITLE | typeof STYLE_KEYS_MSG) => {
    const align = getVal(keys.align) || "center";
    const font = getVal(keys.font) || "Inter, system-ui, sans-serif";
    const sizeRaw = getVal(keys.size) || "24"; // px sayı string
    const color = getVal(keys.color) || "#111111";
    const weight = getVal(keys.weight) || "600";
    const lh = getVal(keys.lineHeight) || "1.5";
    const ls = getVal(keys.letterSpacing) || "0";
    const shadowKey = getVal(keys.shadow) || "none";
    const sizePx = /^\d+(\.\d+)?$/.test(sizeRaw) ? `${sizeRaw}px` : sizeRaw;

    return {
      unicodeBidi: "plaintext" as const,
      whiteSpace: "pre-wrap" as const,
      textAlign: align as any,
      fontFamily: font || undefined,
      fontSize: sizePx,
      color,
      fontWeight: weight as any,
      lineHeight: lh,
      letterSpacing: ls,
      textShadow: SHADOW_MAP[shadowKey] || "",
    };
  };

  /** ----- Toolbar ----- */
  function Toolbar({
                     which,
                     keys,
                     defaultPx,
                   }: {
    which: "title" | "msg";
    keys: typeof STYLE_KEYS_TITLE | typeof STYLE_KEYS_MSG;
    defaultPx: string;
  }) {
    const currentAlign = (getVal(keys.align) as "left" | "center" | "right" | "justify") || "center";
    const currentFont = getVal(keys.font) || "Inter, system-ui, sans-serif";
    const currentSizePx = getVal(keys.size) || defaultPx; // PX string
    const currentColor = getVal(keys.color) || "#111111";
    const currentWeight = getVal(keys.weight) || "600";
    const currentLH = getVal(keys.lineHeight) || "1.5";
    const currentLS = getVal(keys.letterSpacing) || "0";
    const currentShadow = getVal(keys.shadow) || "none";

    // --- Lokal state: Size (px) fokus kaçmasını önler
    const [sizeLocal, setSizeLocal] = useState<string>(currentSizePx);
    useEffect(() => {
      setSizeLocal(currentSizePx);
    }, [currentSizePx]);

    const commitSize = () => {
      const clean = (sizeLocal || "").toString().replace(/[^\d.]/g, "");
      if (!clean) return;
      if (clean !== currentSizePx) setVal(keys.size, clean);
    };

    const btn = "px-2 py-1 rounded-md border hover:bg-black/5 transition";
    const sel = "px-2 py-1 rounded-md border bg-white/80";
    const num = "w-24 px-2 py-1 rounded-md border bg-white/80";

    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white/70 backdrop-blur px-2 py-2">
        {/* Bold/Italic/Underline */}
        <div className="flex items-center gap-1 rounded-lg bg-white/80 px-1 py-1 border">
          <button type="button" className={btn}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runCmd(which, () => document.execCommand("bold"));
                  }}>
            B
          </button>
          <button type="button" className={`${btn} italic`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runCmd(which, () => document.execCommand("italic"));
                  }}>
            I
          </button>
          <button type="button" className={`${btn} underline`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runCmd(which, () => document.execCommand("underline"));
                  }}>
            U
          </button>
        </div>

        {/* HİZALAMA — segment yerine DROPDOWN, runCmd YOK */}
        <label className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Align</span>
          <select
            className={sel}
            value={currentAlign}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value as "left" | "center" | "right" | "justify";
              setVal(keys.align, v);
              // runCmd yok; önizlemeyi boxStyleFrom sağlıyor, fokus kaçmaz
            }}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </label>

        {/* Font ailesi */}
        <select className={sel} value={currentFont}
                onChange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  setVal(keys.font, v);
                  runCmd(which, () => document.execCommand("fontName", false, v));
                }}>
          {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Boyut (PX) — lokal state + blur/Enter'da commit */}
        <label className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Size (px)</span>
          <input
            type="number"
            min={8}
            max={160}
            step={1}
            className={num}
            value={sizeLocal}
            onChange={(e) => setSizeLocal((e.target as HTMLInputElement).value)}
            onBlur={commitSize}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                commitSize();
                (e.currentTarget as HTMLInputElement).blur();
              }
              if (e.key === "Escape") {
                setSizeLocal(currentSizePx);
                (e.currentTarget as HTMLInputElement).blur();
              }
            }}
          />
        </label>

        {/* Weight */}
        <select className={sel} value={currentWeight}
                onChange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  setVal(keys.weight, v);
                  applyInlineStyle(which, {fontWeight: v as any});
                }}>
          {WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>

        {/* line-height */}
        <select className={sel} value={currentLH}
                onChange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  setVal(keys.lineHeight, v);
                  applyInlineStyle(which, {lineHeight: v as any});
                }}>
          {LH_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        {/* letter-spacing */}
        <select className={sel} value={currentLS}
                onChange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  setVal(keys.letterSpacing, v);
                  applyInlineStyle(which, {letterSpacing: v as any});
                }}>
          {LS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>

        {/* shadow */}
        <select className={sel} value={currentShadow}
                onChange={(e) => {
                  const v = (e.target as HTMLSelectElement).value;
                  setVal(keys.shadow, v);
                  applyInlineStyle(which, {textShadow: (SHADOW_MAP[v] || "") as any});
                }}>
          <option value="none">Gölgesiz</option>
          <option value="soft">Soft</option>
          <option value="glow">Glow</option>
          <option value="hard">Hard</option>
        </select>

        {/* Renk */}
        <label className="flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1 border">
          <span className="text-xs text-neutral-500">Renk</span>
          <input type="color" className="w-9 h-8 rounded" value={currentColor}
                 onChange={(e) => {
                   const v = (e.target as HTMLInputElement).value;
                   setVal(keys.color, v);
                   runCmd(which, () => document.execCommand("foreColor", false, v));
                 }}/>
        </label>

        {/* Temizle */}
        <button type="button"
                className="px-2 py-1 rounded-md border hover:bg-black/5 transition border-red-300 text-red-600"
                onMouseDown={(e) => {
                  e.preventDefault();
                  runCmd(which, () => {
                    document.execCommand("removeFormat");
                    document.execCommand("unlink");
                  });
                }}>
          Temizle
        </button>
      </div>
    );
  }

  /** ----- Diğer ayarlar listesi (parallax_* hariç) ----- */
  const otherKeys = useMemo(() => {
    const ignorePrefix = "parallax_";
    const ignoreSet = new Set<string>([
      RICH_KEYS.title, RICH_KEYS.message,
      ...Object.values(STYLE_KEYS_TITLE),
      ...Object.values(STYLE_KEYS_MSG),
      "parallax_bg_mode", "parallax_bg_url", "parallax_overlay_opacity", "parallax_block_align",
      "parallax_underline_gradient", "parallax_panel_style"
    ]);
    return Object.keys(rows)
      .filter(k => !ignoreSet.has(k) && !k.startsWith(ignorePrefix))
      .sort();
  }, [rows]);

  /** ----- BG upload (ürün/kategoriyle aynı bucket) ----- */
  const onBgFileChange = async (file?: File | null) => {
    setBgUploadErr(null);
    if (!file) return;

    let bucket = bucketName;
    if (!bucket) {
      const inferred = await inferBucketNameFromDb();
      if (inferred) {
        bucket = inferred;
        setBucketName(inferred);
      }
    }
    if (!bucket) {
      setBgUploadErr(
        'Bucket belirlenemedi. Lütfen env "NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET" ayarla ya da ürün/kategori görsel URL\'lerinden birini kaydet.'
      );
      return;
    }

    try {
      setBgUploading(true);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `parallax/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const {error: upErr} = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      const {data: pub} = supabase.storage.from(bucket).getPublicUrl(path);
      const url = pub?.publicUrl || "";
      if (!url) throw new Error("Public URL alınamadı.");

      setVal("parallax_bg_url", url);
      setStatus("Arka plan görseli yüklendi ve kaydedilmeye hazır.");
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("bucket not found")) {
        setBgUploadErr(`Bucket bulunamadı: "${bucket}". Supabase > Storage'da bu isimde bucket olduğundan emin ol.`);
      } else {
        setBgUploadErr(msg || "Yükleme başarısız.");
      }
    } finally {
      setBgUploading(false);
    }
  };

  /** ----- Render ----- */
  return (
    <div className="space-y-8">
      {/* Üst bar + durum */}
      <div className="rounded-2xl border p-4 md:p-5 bg-white/60 backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Ayarlar</h2>
              {/*<span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">*/}
              {/*  v3 (px sizes + dropdown align)*/}
              {/*</span>*/}
              {bucketName && (
                <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 border">
                  bucket: <b>{bucketName}</b>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={load} className="px-4 py-2 rounded-lg border" disabled={saving || loading}>
                Yenile
              </button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-black text-white" disabled={saving || loading}>
                Kaydet
              </button>
            </div>
          </div>
          {status && (
            <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              {status}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Yükleniyor…</div>
      ) : (
        <>
          {/* TITLE */}
          <section className="rounded-2xl border p-4 md:p-5 space-y-3 bg-neutral-50">
            <h3 className="text-lg font-semibold">Parallax Başlık</h3>
            <Toolbar which="title" keys={STYLE_KEYS_TITLE} defaultPx="36"/>
            <div
              ref={titleRef}
              className="min-h-[90px] border rounded-xl p-3 bg-white prose max-w-none"
              contentEditable suppressContentEditableWarning
              dir="ltr" spellCheck={false}
              style={boxStyleFrom(STYLE_KEYS_TITLE)}
              onInput={onEditorInput("title")}
              onMouseUp={onEditorSelectChange("title")}
              onKeyUp={onEditorSelectChange("title")}
            />
            <p className="text-xs text-neutral-500">HTML olarak kaydedilir: <code>{RICH_KEYS.title}</code></p>
          </section>

          {/* MESSAGE */}
          <section className="rounded-2xl border p-4 md:p-5 space-y-3 bg-neutral-50">
            <h3 className="text-lg font-semibold">Parallax Mesaj</h3>
            <Toolbar which="msg" keys={STYLE_KEYS_MSG} defaultPx="24"/>
            <div
              ref={msgRef}
              className="min-h-[120px] border rounded-xl p-3 bg-white prose max-w-none"
              contentEditable suppressContentEditableWarning
              dir="ltr" spellCheck={false}
              style={boxStyleFrom(STYLE_KEYS_MSG)}
              onInput={onEditorInput("msg")}
              onMouseUp={onEditorSelectChange("msg")}
              onKeyUp={onEditorSelectChange("msg")}
            />
            <p className="text-xs text-neutral-500">HTML olarak kaydedilir: <code>{RICH_KEYS.message}</code></p>
          </section>

          {/* Parallax Arkaplan & Yerleşim */}
          <section className="rounded-2xl border p-4 md:p-5 space-y-4">
            <h3 className="text-lg font-semibold">Parallax Arkaplan & Yerleşim</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Arkaplan Modu</span>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={rows["parallax_bg_mode"] || "white"}
                  onChange={(e) => setVal("parallax_bg_mode", (e.target as HTMLSelectElement).value)}
                >
                  <option value="white">White</option>
                  <option value="transparent">Transparent</option>
                  <option value="image">Image</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Blok Hizası</span>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={rows["parallax_block_align"] || "center"}
                  onChange={(e) => setVal("parallax_block_align", (e.target as HTMLSelectElement).value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Overlay Opaklığı (0–1)</span>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  type="number"
                  step="0.01" min="0" max="1"
                  value={rows["parallax_overlay_opacity"] || "0.35"}
                  onChange={(e) => setVal("parallax_overlay_opacity", (e.target as HTMLInputElement).value)}
                />
              </label>

              {/* PANEL STİLİ */}
              <label className="block">
                <span className="block text-sm font-medium mb-1">Panel Stili</span>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={rows["parallax_panel_style"] || "none"}
                  onChange={(e) => setVal("parallax_panel_style", (e.target as HTMLSelectElement).value)}
                >
                  <option value="none">Transparent (panel yok)</option>
                  <option value="glass">Glass</option>
                  <option value="card">Card</option>
                </select>
              </label>
            </div>

            {(rows["parallax_bg_mode"] || "white") === "image" && (
              <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
                <div className="space-y-2">
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">Arkaplan Görseli URL</span>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={rows["parallax_bg_url"] || "/parallax.jpg"}
                      onChange={(e) => setVal("parallax_bg_url", (e.target as HTMLInputElement).value)}
                    />
                  </label>

                  <div className="rounded-xl border p-3 bg-white">
                    <div className="text-xs text-neutral-500 mb-2">Önizleme</div>
                    <div className="aspect-[16/9] rounded-lg overflow-hidden bg-neutral-100 grid place-items-center">
                      {rows["parallax_bg_url"] ? (
                        <img src={rows["parallax_bg_url"]} alt="Background preview"
                             className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-neutral-400">Önizleme yok</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-sm font-medium">Görsel Yükle</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={bgUploading}
                    onChange={(e) => onBgFileChange(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    disabled={bgUploading}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = () => onBgFileChange((input.files?.[0]) || null);
                      input.click();
                    }}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-black/5 transition"
                  >
                    {bgUploading ? "Yükleniyor…" : "Cihazdan Seç"}
                  </button>
                  {bgUploadErr && (
                    <div className="text-xs text-red-600">{bgUploadErr}</div>
                  )}
                </div>
              </div>
            )}

            <label className="block">
              <span className="block text-sm font-medium mb-1">Underline Gradient</span>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={rows["parallax_underline_gradient"] || "none"}
                onChange={(e) => setVal("parallax_underline_gradient", (e.target as HTMLSelectElement).value)}
              >
                <option value="none">None</option>
                <option value="gold">Gold</option>
                <option value="forest">Forest</option>
                <option value="rose">Rose</option>
                <option value="ocean">Ocean</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                İstersen değer olarak bir <code>linear-gradient(...)</code> da kaydedebilirsin.
              </p>
            </label>
          </section>

          {/* Diğer ayarlar */}
          <section className="rounded-2xl border p-4 md:p-5">

            {/* Sosyal Linkler */}
            {/*<div className="rounded-2xl border p-4 md:p-6">*/}
            {/*  <h3 className="text-lg font-semibold mb-3">Sosyal Linkler</h3>*/}
            {/*  <div className="grid md:grid-cols-2 gap-4">*/}
            {/*    <label className="block">*/}
            {/*      <span className="block text-sm font-medium mb-1">Instagram URL</span>*/}
            {/*      <input*/}
            {/*        type="url"*/}
            {/*        placeholder="https://instagram.com/hesabiniz"*/}
            {/*        className="w-full rounded-xl border px-3 py-2"*/}
            {/*        value={rows["social_instagram"] || ""}*/}
            {/*        onChange={(e) => setVal("social_instagram", (e.target as HTMLInputElement).value)}*/}
            {/*      />*/}
            {/*    </label>*/}
            {/*    <label className="block">*/}
            {/*      <span className="block text-sm font-medium mb-1">Twitter/X URL</span>*/}
            {/*      <input*/}
            {/*        type="url"*/}
            {/*        placeholder="https://twitter.com/hesabiniz"*/}
            {/*        className="w-full rounded-xl border px-3 py-2"*/}
            {/*        value={rows["social_twitter"] || ""}*/}
            {/*        onChange={(e) => setVal("social_twitter", (e.target as HTMLInputElement).value)}*/}
            {/*      />*/}
            {/*    </label>*/}
            {/*  </div>*/}
            {/*  <p className="text-xs text-neutral-500 mt-2">Boş bırakılırsa footer'da varsayılan bağlantılar kullanılır.</p>*/}
            {/*</div>*/}

            <h3 className="text-lg font-semibold mb-3">Diğer Ayarlar</h3>
            {Object.keys(rows).filter(k => !k.startsWith("parallax_") && k !== RICH_KEYS.title && k !== RICH_KEYS.message).length === 0 ? (
              <p className="text-sm text-neutral-500">Gösterilecek başka ayar yok.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(rows)
                  .filter(k => !k.startsWith("parallax_") && k !== RICH_KEYS.title && k !== RICH_KEYS.message)
                  .sort()
                  .map((k) => (
                    <label key={k} className="block">
                      <span className="block text-sm font-medium mb-1">{k}</span>
                      {(getVal(k).length > 120) ? (
                        <textarea
                          className="w-full border rounded-lg px-3 py-2 min-h-[90px]"
                          value={getVal(k)}
                          onChange={(e) => setVal(k, e.target.value)}
                        />
                      ) : (
                        <input
                          className="w-full border rounded-lg px-3 py-2"
                          value={getVal(k)}
                          onChange={(e) => setVal(k, e.target.value)}
                        />
                      )}
                    </label>
                  ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** ---------- helpers ---------- */
function ensureDefaults<T extends { [k in keyof T]: string }>(
  map: Record<string, string>,
  keys: T,
  def: { [k in keyof T]: string }
) {
  (Object.keys(keys) as (keyof T)[]).forEach((k) => {
    const key = keys[k];
    if (!map[key]) map[key] = def[k];
  });
}
