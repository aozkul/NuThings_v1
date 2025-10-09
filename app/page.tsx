// app/page.tsx
import {supabaseServer} from "@/src/lib/supabaseServer";
import HeroCarousel from "@/src/components/HeroCarousel";
import TestimonialsSection from "@/src/components/Testimonials";
import ParallaxSection from "@/src/components/ParallaxSection";
import type {CSSProperties} from "react";
import FeaturedCarousel from "@/src/components/home/FeaturedCarousel";
import MostLikedCarousel from "@/src/components/home/MostLikedCarousel";

// Anasayfa SEO'yu Supabase settings'ten okur
export async function generateMetadata() {
  const supabase = supabaseServer();
  const {data} = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["home_seo_title", "home_seo_desc"]);

  const map = new Map((data || []).map((r) => [r.key, r.value]));
  const title =
    (map.get("home_seo_title") as string) ||
    "NuThings";
  const description =
    (map.get("home_seo_desc") as string) ||
    "Frische Nüsse, türkischer Honig und mehr.";

  return {
    title,
    description,
    openGraph: {title, description, type: "website"},
    twitter: {card: "summary_large_image", title, description},
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SKey =
  | "parallax_title"
  | "parallax_message"
  | "parallax_bg_mode"
  | "parallax_bg_url"
  | "parallax_overlay_opacity"
  | "parallax_underline_gradient"
  | "parallax_block_align"
  | "parallax_panel_style"
  | "parallax_position"
  // TITLE style keys
  | "parallax_title_font_family"
  | "parallax_title_size"
  | "parallax_title_weight"
  | "parallax_title_align"
  | "parallax_title_line_height"
  | "parallax_title_letter_spacing"
  | "parallax_title_color"
  // MESSAGE style keys
  | "parallax_message_font_family"
  | "parallax_message_size"
  | "parallax_message_weight"
  | "parallax_message_align"
  | "parallax_message_line_height"
  | "parallax_message_letter_spacing"
  | "parallax_message_color";

// helpers
function get(map: Map<string, string | null>, k: SKey, d = ""): string {
  return (map.get(k) ?? d) as string;
}

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ham metin HTML gibi mi? (örn. <div> ... </div>, <p> ... )
const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(String(s));

// basit whitelist (yalnızca şu tag’lara izin ver) + riskli attribute temizliği
const sanitizeAllowList = (html: string) =>
  String(html)
    // izin verilmeyen tag'ları kaldır
    .replace(/<(?!\/?(br|div|p|strong|em|b|i|u|a)\b)[^>]*>/gi, "")
    // event handler attribute'larını sil (onclick vs.)
    .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi, "")
    // javascript: href/src engelle
    .replace(
      /\s(href|src)\s*=\s*(['"])javascript:[\s\S]*?\2/gi,
      " $1=\"#\""
    );

// düz metni <br/> ile kır
const textToHtmlWithBr = (s: string) =>
  escapeHtml(String(s)).replace(/\r?\n/g, "<br/>");

// normalize: HTML ise sanitize et; değilse <br/> ekle
const normalizeHtml = (raw: string) =>
  looksLikeHtml(raw) ? sanitizeAllowList(raw) : textToHtmlWithBr(raw);

export default async function Page() {
  const supabase = supabaseServer();

  // Kategoriler (slider için)
  const {data: cats} = await supabase
    .from("categories")
    .select("*")
    .order("position", {ascending: true});

  // Parallax ayarları
  const PARALLAX_KEYS: SKey[] = [
    "parallax_title",
    "parallax_message",
    "parallax_bg_mode",
    "parallax_bg_url",
    "parallax_overlay_opacity",
    "parallax_underline_gradient",
    "parallax_block_align",
    "parallax_panel_style",
    "parallax_position",
    // TITLE
    "parallax_title_font_family",
    "parallax_title_size",
    "parallax_title_weight",
    "parallax_title_align",
    "parallax_title_line_height",
    "parallax_title_letter_spacing",
    "parallax_title_color",
    // MESSAGE
    "parallax_message_font_family",
    "parallax_message_size",
    "parallax_message_weight",
    "parallax_message_align",
    "parallax_message_line_height",
    "parallax_message_letter_spacing",
    "parallax_message_color",
  ];

  const HOME_KEYS = ["home_show_featured", "home_show_most_liked"] as const;

  const {data: settingsRows} = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [...PARALLAX_KEYS, ...HOME_KEYS] as any);

  const settings = new Map((settingsRows || []).map((r) => [r.key, r.value]));

  const showFeatured = (settings.get("home_show_featured") ?? "true") === "true";
  const showMostLiked = (settings.get("home_show_most_liked") ?? "true") === "true";

  const position = (get(settings, "parallax_position", "after_hero") ||
    "after_hero") as "after_hero" | "after_featured" | "after_testimonials";

  const panelStyle =
    (get(settings, "parallax_panel_style", "none") as
      | "none"
      | "glass"
      | "card") || "none";

  // TITLE stili (PX)
  const titleStyle: CSSProperties = {
    fontFamily:
      get(settings, "parallax_title_font_family", "") ||
      "Inter, system-ui, sans-serif",
    fontSize: get(settings, "parallax_title_size", "36"),
    fontWeight: (get(settings, "parallax_title_weight", "700") as any) || 700,
    lineHeight:
      (get(settings, "parallax_title_line_height", "1.25") as any) || "1.25",
    letterSpacing:
      (get(settings, "parallax_title_letter_spacing", "0") as any) || "0",
    color: get(settings, "parallax_title_color", "#111111") || "#111111",
    textAlign:
      (get(settings, "parallax_title_align", "center") as any) || "center",
  };

  // MESSAGE stili (PX) — ayrı!
  const messageStyle: CSSProperties = {
    fontFamily:
      get(settings, "parallax_message_font_family", "") ||
      "Inter, system-ui, sans-serif",
    fontSize: get(settings, "parallax_message_size", "24"),
    fontWeight: (get(settings, "parallax_message_weight", "600") as any) || 600,
    lineHeight:
      (get(settings, "parallax_message_line_height", "1.5") as any) || "1.5",
    letterSpacing:
      (get(settings, "parallax_message_letter_spacing", "0") as any) || "0",
    color: get(settings, "parallax_message_color", "#111111") || "#111111",
    textAlign:
      (get(settings, "parallax_message_align", "center") as any) || "center",
  };

  const blockAlign = (get(settings, "parallax_block_align", "center") ||
    "center") as "left" | "center" | "right";

  const bgMode = (get(settings, "parallax_bg_mode", "white") ||
    "white") as "white" | "transparent" | "image";

  const bgUrl =
    get(settings, "parallax_bg_url", "/parallax.jpg") || "/parallax.jpg";
  const overlayOpacity =
    Number(get(settings, "parallax_overlay_opacity", "0.35")) || 0.35;
  const rawUnderline = (get(settings, "parallax_underline_gradient", "none") || "none").toLowerCase();

  const underlineGradient: "none" | "warm" | "cool" | "brand" =
    rawUnderline === "warm" || rawUnderline === "cool" || rawUnderline === "brand"
      ? (rawUnderline as "warm" | "cool" | "brand")
      : "none";

  // DB değerlerini deterministik & doğru şekilde HTML'e çevir
  const rawTitle = get(settings, "parallax_title", "Hoş geldiniz");
  const rawMessage = get(settings, "parallax_message", "");

  // title genelde düz metin; yine de HTML ise sanitize et
  const stableTitleHTML = looksLikeHtml(rawTitle)
    ? sanitizeAllowList(rawTitle)
    : `<span>${escapeHtml(rawTitle)}</span>`;

  // message: HTML ise sanitize, değilse <br/> ile satıra çevir
  const stableMessageHTML = normalizeHtml(rawMessage);

  // Slider kategorileri: boşsa placeholder ile göster (slider hep en üstte)
  const catsList =
    cats && cats.length
      ? cats
      : [
        {
          id: "placeholder",
          name: "Öne Çıkanlar",
          image_url: bgUrl,
          position: 0,
          tagline: "Doğal, taze ve lezzetli",
        },
      ];

  // Parallax bileşeni — sadece HTML besliyoruz (plain değerler boş)
  const Parallax =
    settingsRows && settingsRows.length ? (
      <ParallaxSection
        title="" // plain kullanmıyoruz
        message="" // plain kullanmıyoruz
        titleHTML={stableTitleHTML}
        messageHTML={stableMessageHTML}
        style={titleStyle}
        messageStyle={messageStyle}
        bgMode={bgMode}
        bgUrl={bgUrl}
        underlineGradient={underlineGradient}
        overlayOpacity={overlayOpacity}
        blockAlign={blockAlign}
        panelStyle={panelStyle}
      />
    ) : null;

  return (
    <div className="space-y-12">
      {/* SLIDER EN ÜSTE */}
      <HeroCarousel cats={catsList}/>

      {position === "after_hero" && Parallax}

      {/* Öne Çıkan Ürünler – oklar + otomatik kaydırma */}
      {showFeatured && (
      <div className="container-tight my-12">
        <FeaturedCarousel/>
      </div>
      )}

      {position === "after_featured" && Parallax}

      {/* En Çok Beğenilen – oklar + otomatik kaydırma */}
      {showMostLiked && (
      <div className="container-tight my-12">
        <MostLikedCarousel/>
      </div>
      )}

      <TestimonialsSection/>

      {position === "after_testimonials" && Parallax}
    </div>
  );
}
