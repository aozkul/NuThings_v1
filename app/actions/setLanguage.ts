"use server";
import {cookies} from "next/headers";

export async function setLanguage(locale: "de" | "tr" | "en") {
  const jar = await cookies();               // Next 15: await gerekli
  jar.set("lang", locale, {path: "/", maxAge: 60 * 60 * 24 * 365});
}
