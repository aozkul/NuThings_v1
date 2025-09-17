import {
    Inter,
    Playfair_Display,
    Poppins,
    Montserrat,
    Lora,
    Roboto_Slab,
    Dancing_Script,
    Great_Vibes,
} from "next/font/google";

/**
 * Önemli:
 * - 'subsets' için değişken/spread KULLANMIYORUZ (Netlify prod type check takılıyor).
 * - Variable olmayan fontlarda weight zorunlu (Great_Vibes: sadece "400").
 * - display: "swap".
 */

const inter = Inter({
    subsets: ["latin", "latin-ext"],
    weight: ["300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
});

const poppins = Poppins({
    subsets: ["latin", "latin-ext"],
    weight: ["300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
});

const montserrat = Montserrat({
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
});

const lora = Lora({
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const robotoSlab = Roboto_Slab({
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const dancing = Dancing_Script({
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const greatVibes = Great_Vibes({
    subsets: ["latin", "latin-ext"],
    weight: "400",
    display: "swap",
});

/** Admin’de saklanacak anahtarlar */
export type FontKey =
    | "system"
    | "inter"
    | "playfair"
    | "poppins"
    | "montserrat"
    | "lora"
    | "roboto_slab"
    | "dancing_script"
    | "great_vibes";

/** Tailwind className eşlemesi */
export const fontClassByKey: Record<Exclude<FontKey, "system">, string> = {
    inter: inter.className,
    playfair: playfair.className,
    poppins: poppins.className,
    montserrat: montserrat.className,
    lora: lora.className,
    roboto_slab: robotoSlab.className,
    dancing_script: dancing.className,
    great_vibes: greatVibes.className,
};

/** Admin adından uygun font class'ını döndürür */
export function getFontClassFromSetting(val?: string | null): string {
    if (!val) return "";
    const k = String(val).trim().toLowerCase();
    if (k === "system" || k === "default") return "";
    if (k.includes("inter")) return fontClassByKey.inter;
    if (k.includes("playfair")) return fontClassByKey.playfair;
    if (k.includes("poppins")) return fontClassByKey.poppins;
    if (k.includes("montserrat")) return fontClassByKey.montserrat;
    if (k.includes("lora")) return fontClassByKey.lora;
    if (k.includes("roboto slab") || k.includes("roboto_slab"))
        return fontClassByKey.roboto_slab;
    if (k.includes("dancing")) return fontClassByKey.dancing_script;
    if (k.includes("great vibes") || k.includes("great_vibes"))
        return fontClassByKey.great_vibes;
    return "";
}
