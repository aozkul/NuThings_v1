import React, {createElement as h} from "react";
import LegalShell from "@/src/components/legal/LegalShell";
import {getSettings} from "@/src/lib/settings";

export const metadata = {title: "Datenschutzerklärung | Nut Things"};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const s = await getSettings([
    "privacy_controller_name", "privacy_controller_address", "privacy_controller_email",
  ]);

  const Intro = h("p", null,
    h("strong", null, "Verantwortlicher"), h("br"),
    (s.privacy_controller_name || "[Unternehmensname / Inhaber]"), ", ",
    (s.privacy_controller_address || "[Anschrift]"), ", ",
    "E-Mail: ", (s.privacy_controller_email || "[E-Mail-Adresse]")
  );

  const Allgemeines = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Allgemeines"),
    h("p", null, "Wir verarbeiten personenbezogene Daten gemäß DSGVO. Diese Erklärung informiert Sie über Art, Umfang und Zwecke der Verarbeitung sowie über Ihre Rechte.")
  );

  const Hosting = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Hosting & Backend"),
    h("p", null, "Die Website wird auf [Hosting-Anbieter] betrieben. Anfragen, Logfiles und Metadaten können serverseitig erhoben werden. Anwendungsdaten werden in z. B. Supabase verarbeitet.")
  );

  const Bestellung = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Bestellung & Zahlung"),
    h("p", null, "Zur Bestellabwicklung verarbeiten wir Stammdaten, Kommunikationsdaten, Vertragsdaten und Zahlungsdaten. Bei Zahlung via PayPal werden Sie zu PayPal weitergeleitet. Es gelten die Datenschutzhinweise von PayPal.")
  );

  const Cookies = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Cookies & Consent"),
    h("p", null, "Wir verwenden technisch notwendige Cookies. Für optionale Cookies (Analyse/Marketing) holen wir Ihre Einwilligung über ein Consent-Banner ein. Sie können die Einwilligung jederzeit widerrufen.")
  );

  const Analyse = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Analyse & Marketing"),
    h("p", null, "Sofern eingewilligt, setzen wir Dienste wie Google Analytics ein. Es werden pseudonyme Nutzungsprofile erstellt; IP-Adressen werden gekürzt. Anbieter: Google Ireland Limited.")
  );

  const Rechtsgrundlagen = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Rechtsgrundlagen"),
    h("ul", {className: "list-disc pl-5 space-y-1"},
      h("li", null, "Art. 6 Abs. 1 lit. b DSGVO (Vertrag/Bestellung)"),
      h("li", null, "Art. 6 Abs. 1 lit. a DSGVO (Einwilligung, z. B. Analytics)"),
      h("li", null, "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, z. B. Sicherheit)")
    )
  );

  const Rechte = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Ihre Rechte"),
    h("ul", {className: "list-disc pl-5 space-y-1"},
      h("li", null, "Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch"),
      h("li", null, "Widerruf erteilter Einwilligungen"),
      h("li", null, "Beschwerde bei einer Aufsichtsbehörde")
    ),
    h("h2", {className: "font-semibold text-lg mt-4 mb-2"}, "Kontakt"),
    h("p", null, "Für Datenschutzanfragen: ", (s.privacy_controller_email || "[Kontakt E-Mail]"), " – Wir beantworten Ihr Anliegen zeitnah.")
  );

  return h(LegalShell, {
    title: "Datenschutzerklärung", subtitle: "Informationen gemäß DSGVO", children: [
      Intro,
      Allgemeines,
      Hosting,
      Bestellung,
      Cookies,
      Analyse,
      Rechtsgrundlagen,
      Rechte
    ]
  });
}
