import React, { createElement as h } from "react";
import LegalShell from "@/src/components/legal/LegalShell";
import { getSettings } from "@/src/lib/settings";

export const metadata = { title: "Versand & Zahlung | Nut Things" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const s = await getSettings(["shipping_area","shipping_time","shipping_costs","payment_methods"]);

  const methods = (s.payment_methods || "PayPal").split(",").map((m) => m.trim()).filter(Boolean);

  const Grid = h("section", { className: "grid md:grid-cols-2 gap-4" },
    h("div", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Versand"),
      h("ul", { className: "list-disc pl-5 space-y-1" },
        h("li", null, h("strong", null, "Versandgebiet:"), " ", (s.shipping_area || "Deutschland")),
        h("li", null, h("strong", null, "Lieferzeit:"), " ", (s.shipping_time || "2–4 Werktage")),
        h("li", null, h("strong", null, "Versandkosten:"), " ", (s.shipping_costs || "4,90 € pauschal – ab 49 € frei"))
      )
    ),
    h("div", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
      h("h2", { className: "font-semibold text-lg mb-2" }, "Zahlung"),
      h("ul", { className: "list-disc pl-5 space-y-1" },
        ...methods.map((m, i) => h("li", { key: i }, m))
      )
    )
  );

  const Prices = h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
    h("h2", { className: "font-semibold text-lg mb-2" }, "Preise"),
    h("p", null, "Alle Preise verstehen sich in EUR inkl. gesetzlicher MwSt. Etwaige Zusatzkosten werden im Checkout ausgewiesen.")
  );

  return h(LegalShell, { title: "Versand & Zahlung", subtitle: "Lieferbedingungen, Zahlungsarten und Preisangaben" }, Grid, Prices);
}
