"use client";

import React from "react";
import clsx from "clsx";
import {getFontClassFromSetting} from "@/src/styles/fonts";

type BgMode = "white" | "transparent" | "image";
type BlockAlign = "left" | "center" | "right";
type PanelStyle = "none" | "glass" | "card";

type Props = {
    title: string;
    message: string;
    titleHTML?: string;
    messageHTML?: string;
    style: React.CSSProperties;
    messageStyle?: React.CSSProperties;
    bgMode?: BgMode;
    bgUrl?: string | null;
    blockAlign?: BlockAlign;
    panelStyle?: PanelStyle;
    underlineGradient?: "none" | "warm" | "cool" | "brand";
    overlayOpacity?: number; // legacy
};

const HERO_HEIGHT_CLASSES =
    "h-[320px] sm:h-[420px] lg:h-[520px] xl:h-[580px]";

function toPx(v: string | number | undefined, fallback: number): string {
    if (v == null) return `${fallback}px`;
    if (typeof v === "number") return `${v}px`;
    return /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
}

export default function ParallaxSection({
                                            title,
                                            message,
                                            titleHTML,
                                            messageHTML,
                                            style,
                                            messageStyle,
                                            bgMode = "white",
                                            bgUrl = null,
                                            blockAlign = "center",
                                            panelStyle = "none",
                                            underlineGradient = "none",
                                            overlayOpacity,
                                        }: Props) {
    const titleFontClass = getFontClassFromSetting(style?.fontFamily as string);
    const msgFontClass = getFontClassFromSetting(
        (messageStyle?.fontFamily ?? style?.fontFamily) as string
    );

    // Paneli gerçekten sola/sağa yaslamak için margin auto hilesi:
    // left  => mr-auto
    // center=> mx-auto
    // right => ml-auto
    const panelPositionClass =
        blockAlign === "left"
            ? "mr-auto"
            : blockAlign === "right"
                ? "ml-auto"
                : "mx-auto";

    // Arka plan: görsel varsa şeffaf, yoksa site rengi
    const sectionBgClass =
        (bgUrl && bgUrl.length > 0) || bgMode === "image"
            ? "bg-transparent"
            : bgMode === "transparent"
                ? "bg-transparent"
                : "bg-white";

    const underline =
        underlineGradient === "none"
            ? null
            : underlineGradient === "warm"
                ? "bg-gradient-to-r from-amber-500/80 via-orange-500/80 to-rose-500/80"
                : underlineGradient === "cool"
                    ? "bg-gradient-to-r from-sky-500/80 via-cyan-500/80 to-emerald-500/80"
                    : "bg-gradient-to-r from-indigo-500/80 via-blue-500/80 to-cyan-500/80";

    const panelStyleClass = clsx(
        "max-w-3xl w-auto", // ÖNEMLİ: w-full kaldırıldı; blok artık daralabilir
        panelStyle === "none" && "bg-transparent",
        panelStyle === "glass" &&
        "bg-white/60 backdrop-blur-md ring-1 ring-black/5 rounded-2xl shadow-sm",
        panelStyle === "card" &&
        "bg-white rounded-2xl shadow-lg ring-1 ring-black/5"
    );

    return (
        <section
            className={clsx(
                "relative w-full overflow-hidden",
                sectionBgClass,
                HERO_HEIGHT_CLASSES
            )}
        >
            {/* Arka plan görseli: bgUrl varsa göster */}
            {bgMode === "image" && bgUrl ? (
                <div className="absolute inset-0 z-0">
                    <img
                        src={bgUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                </div>
            ) : null}

            {/* İçerik */}
            <div className="relative z-10 h-full container-tight px-4 mx-auto">
                <div className="h-full flex items-center">
                    <div
                        className={clsx(
                            panelStyleClass,
                            panelPositionClass,
                            "p-5 sm:p-6 md:p-8 flex flex-col gap-3 md:gap-4"
                        )}
                    >
                        {/* Başlık */}
                        <h2
                            className={clsx("tracking-tight", titleFontClass)}
                            style={{
                                textAlign: (style?.textAlign as any) ?? "center",
                                fontWeight: style?.fontWeight ?? 700,
                                color: (style?.color as string) ?? "#111827",
                                fontSize: toPx(style?.fontSize, 36),
                                lineHeight: (style?.lineHeight as string) ?? "1.2",
                                letterSpacing: (style?.letterSpacing as string) ?? "0",
                                // @ts-ignore
                                textShadow: (style as any)?.textShadow ?? "none",
                            }}
                            dangerouslySetInnerHTML={{__html: titleHTML ?? title}}
                        />

                        {underline && <span className="h-1 w-24 rounded-full"/>}

                        {/* Mesaj */}
                        {!!(messageHTML ?? message) && (
                            <div
                                className={clsx("opacity-90", msgFontClass)}
                                style={{
                                    textAlign:
                                        (messageStyle?.textAlign as any) ??
                                        ((style?.textAlign as any) ?? "center"),
                                    fontWeight: messageStyle?.fontWeight ?? style?.fontWeight ?? 500,
                                    color:
                                        (messageStyle?.color as string) ??
                                        ((style?.color as string) ?? "#374151"),
                                    fontSize: toPx(messageStyle?.fontSize ?? style?.fontSize, 20),
                                    lineHeight:
                                        (messageStyle?.lineHeight as string) ??
                                        ((style?.lineHeight as string) ?? "1.5"),
                                    letterSpacing:
                                        (messageStyle?.letterSpacing as string) ??
                                        ((style?.letterSpacing as string) ?? "0"),
                                    // @ts-ignore
                                    textShadow:
                                        (messageStyle as any)?.textShadow ??
                                        ((style as any)?.textShadow ?? "none"),
                                }}
                                dangerouslySetInnerHTML={{__html: messageHTML ?? message}}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
