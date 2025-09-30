import React, { createElement as h } from "react";
import LegalShell from "@/src/components/legal/LegalShell";

export const metadata = { title: "AGB | Nut Things" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const Blocks = h("section", { className: "space-y-4" },
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Geltungsbereich"),
      h("p", null, "Diese AGB gelten für alle Bestellungen über unseren Online-Shop durch Verbraucher und Unternehmer.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Vertragspartner & Vertragsschluss"),
      h("p", null, "Der Kaufvertrag kommt zustande mit [Unternehmensname]. Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot dar. Ein verbindliches Angebot geben Sie mit Abschluss des Bestellvorgangs ab. Die Annahme erfolgt durch Bestellbestätigung per E-Mail oder Versand der Ware.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Preise & Versandkosten"),
      h("p", null, "Alle Preise sind in EUR inkl. gesetzlicher MwSt. angegeben. Zzgl. fallen ggf. Versandkosten an, die auf der Seite „Versand & Zahlung“ ausgewiesen sind.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Zahlung"),
      h("p", null, "Wir bieten u. a. PayPal an. Es gelten die Bedingungen des Zahlungsanbieters.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Lieferung"),
      h("p", null, "Wir liefern innerhalb Deutschlands. Lieferzeiten sind auf der Produktseite oder im Checkout ersichtlich.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Widerrufsrecht"),
      h("p", null, "Verbrauchern steht ein 14-tägiges Widerrufsrecht zu. Details siehe „Widerrufsbelehrung“.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Gewährleistung"),
      h("p", null, "Es gelten die gesetzlichen Mängelhaftungsrechte.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Eigentumsvorbehalt"),
      h("p", null, "Die Ware bleibt bis zur vollständigen Zahlung unser Eigentum.")
    ),
    h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Streitbeilegung"),
      h("p", null, "Die EU-Kommission stellt eine Plattform für Online-Streitbeilegung bereit. Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.")
    )
  );

  return h(LegalShell, { title: "Allgemeine Geschäftsbedingungen (AGB)", subtitle: "Rechtsrahmen für Bestellungen", children: [
    Blocks
  ] });
}
