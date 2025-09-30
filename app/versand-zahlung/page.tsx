import React, {createElement as h} from "react";
import LegalShell from "@/src/components/legal/LegalShell";
import {getSettings} from "@/src/lib/settings";

export const metadata = {title: "Versand & Zahlung | Nut Things"};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const s = await getSettings(["shipping_area", "shipping_time", "shipping_costs", "payment_methods"]);

  const methods = (s.payment_methods || "PayPal").split(",").map((m) => m.trim()).filter(Boolean);

  const Grid = h("section", {className: "grid md:grid-cols-2 gap-4"},
    h("div", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
      h("h2", {className: "font-semibold text-lg mb-2"}, "Versand"),
      h("p", null, s.shipping_area || "Lieferungen innerhalb Deutschlands."),
      h("p", null, s.shipping_time || "Versandzeit in der Regel 2–4 Werktage."),
      h("p", null, s.shipping_costs || "Ab 49€ versandkostenfrei.")
    ),
    h("div", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
      h("h2", {className: "font-semibold text-lg mb-2"}, "Zahlungsarten"),
      h("ul", {className: "list-disc pl-5 space-y-1"},
        ...methods.map((m, i) => h("li", {key: i}, m))
      ),
      h("p", {className: "text-sm text-muted-foreground mt-2"},
        "Hinweis: Bei Zahlungen über PayPal gelten die ",
        h("a", {
          href: "https://www.paypal.com/de/webapps/mpp/ua/privacy-full",
          className: "underline",
          target: "_blank",
          rel: "noreferrer"
        }, "Datenschutzhinweise von PayPal"),
        "."
      )
    )
  );

  const Prices = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Preise"),
    h("p", null, "Alle Preise verstehen sich in EUR inkl. gesetzlicher MwSt. Etwaige Zusatzkosten werden im Checkout ausgewiesen.")
  );

  return h(LegalShell, {
    title: "Versand & Zahlung", subtitle: "Lieferbedingungen, Zahlungsarten und Preisangaben", children: [
      Grid, Prices
    ]
  });
}
