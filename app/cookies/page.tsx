import React, {createElement as h} from "react";
import LegalShell from "@/src/components/legal/LegalShell";
import {getSettings} from "@/src/lib/settings";
import {cookies as cookieJar} from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const jar = await cookieJar();
  const locale = (jar.get("lang")?.value || "de") as "tr" | "en" | "de";
  let messages: any = {};
  try {
    messages =
      locale === "tr" ? (await import("../messages/tr.json")).default :
        locale === "en" ? (await import("../messages/en.json")).default :
          (await import("../messages/de.json")).default;
  } catch {
  }
  const L = (key: string, fb: string) => {
    const v = messages?.cookies_page?.[key];
    return typeof v === "string" ? v : fb;
  };
  return {title: `${L("title", "Cookies")} | Nut Things`};
}

export default async function Page() {
  const jar = await cookieJar();
  const locale = (jar.get("lang")?.value || "de") as "tr" | "en" | "de";
  let messages: any = {};
  try {
    messages =
      locale === "tr" ? (await import("../messages/tr.json")).default :
        locale === "en" ? (await import("../messages/en.json")).default :
          (await import("../messages/de.json")).default;
  } catch {
  }
  const L = (key: string, fb: string) => {
    const v = messages?.cookies_page?.[key];
    return typeof v === "string" ? v : fb;
  };

  const s = await getSettings([
    "legal_company_name",
    "legal_address_street",
    "legal_address_city",
    "privacy_controller_name",
    "privacy_controller_email"
  ]);

  const Intro = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, L("title", "Cookies")),
    h("p", null, "Wir verwenden Cookies und ähnliche Technologien, um unsere Website bereitzustellen, zu verbessern und für Marketingzwecke zu nutzen. Einige Cookies sind erforderlich, andere benötigen Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).")
  );

  const Types = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, L("types", "Arten von Cookies")),
    h("ul", {className: "list-disc pl-5 space-y-1"},
      h("li", null, h("strong", null, "Notwendig:"), " Für den Betrieb der Website erforderlich (z. B. Warenkorb, Login, Sprachauswahl)."),
      h("li", null, h("strong", null, "Präferenzen:"), " Merken sich Einstellungen wie Sprache oder Region."),
      h("li", null, h("strong", null, "Statistik:"), " Anonyme Messung der Nutzung (z. B. Seitenaufrufe)."),
      h("li", null, h("strong", null, "Marketing:"), " Zur Anzeige relevanter Inhalte oder Angebote.")
    )
  );

  const Consent = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, L("consent", "Einwilligung verwalten")),
    h("p", null, "Sie können nicht notwendige Cookies jederzeit aktivieren/deaktivieren. Wenn ein Cookie-Banner vorhanden ist, finden Sie dort eine entsprechende Schaltfläche. Andernfalls können Sie die Einstellungen in Ihrem Browser ändern (siehe unten).")
  );

  const Third = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, L("third", "Drittanbieter")),
    h("p", null, "Sofern wir Analysedienste (z. B. Google Analytics) oder Zahlungsdienste (z. B. PayPal) einbinden, können dabei Cookies gesetzt werden. Details finden Sie in unserer Datenschutzerklärung.")
  );

  const Browser = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, L("browser", "Cookies im Browser steuern")),
    h("p", null, "Sie können Cookies in den Browsereinstellungen löschen oder blockieren. Die Vorgehensweise unterscheidet sich je nach Browser. Prüfen Sie bitte die Hilfe-Seiten Ihres Browsers.")
  );

  const Contact = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, L("contact", "Kontakt & Verantwortlicher")),
    h("p", null, `${s.privacy_controller_name || s.legal_company_name || "[Unternehmen]"}`),
    h("p", null, `${(s.legal_address_street || "")} ${(s.legal_address_city || "")}`.trim() || "[Adresse]"),
    h("p", null, `E-Mail: ${s.privacy_controller_email || "[E-Mail]"}`)
  );

  return h(LegalShell, {
    title: L("title", "Cookies"),
    subtitle: L("subtitle", "Nutzung von Cookies und Ihre Optionen"),
    children: [Intro, Types, Consent, Third, Browser, Contact], // ✅ children props içinde
  });
}