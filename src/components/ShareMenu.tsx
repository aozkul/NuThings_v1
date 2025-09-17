"use client";
import {useState} from "react";
import {Share2} from "lucide-react";

interface ShareMenuProps {
    url: string;            // ürün detay sayfasından gelen relative veya absolute url
    productTitle?: string;
    label?: string;
    mode?: "native" | "menu";
}

export default function ShareMenu({
                                      url,
                                      productTitle = "NuThings",
                                      label = "Paylaş",
                                      mode = "native",
                                  }: ShareMenuProps) {
    const [error, setError] = useState<string | null>(null);

    // --- URL normalize etme ---
    const origin =
        typeof window !== "undefined" ? window.location.origin : "";
    const isAbsolute = /^https?:\/\//i.test(url);
    const finalUrl = isAbsolute
        ? url
        : origin
            ? url.startsWith("/")
                ? origin + url
                : origin + "/" + url
            : url;
    // --------------------------

    const handleShare = async () => {
        setError(null);
        if (navigator.share && mode === "native") {
            try {
                await navigator.share({
                    title: productTitle,
                    url: finalUrl,
                    text: productTitle,
                });
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    setError("Paylaşım iptal edildi veya başarısız oldu.");
                }
            }
        } else {
            // Fallback → mailto
            window.location.href = `mailto:?subject=${encodeURIComponent(
                productTitle
            )}&body=${encodeURIComponent(finalUrl)}`;
        }
    };

    return (
        <div>
            <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-100"
            >
                <Share2 size={16}/>
                {label}
            </button>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
