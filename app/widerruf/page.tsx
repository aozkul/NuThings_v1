import React, { createElement as h } from "react";
import LegalShell from "@/src/components/legal/LegalShell";
import { getSettings } from "@/src/lib/settings";

export const metadata = { title: "Widerrufsbelehrung | Nut Things" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const s = await getSettings(["withdrawal_company","withdrawal_address","withdrawal_email"]);

  const W1 = h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
    h("h2", { className: "font-semibold text-lg mb-2" }, "Widerrufsrecht"),
    h("p", null, "Verbraucher haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.")
  );

  const W2 = h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
    h("h2", { className: "font-semibold text-lg mb-2" }, "Ausübung des Widerrufs"),
    h("p", null, "Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (",
      (s.withdrawal_company || "[Unternehmensname]"), ", ",
      (s.withdrawal_address || "[Anschrift]"), ", E-Mail: ",
      (s.withdrawal_email || "[E-Mail-Adresse]"),
      ") mittels einer eindeutigen Erklärung informieren (z. B. per E-Mail).")
  );

  const W3 = h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
    h("h2", { className: "font-semibold text-lg mb-2" }, "Folgen des Widerrufs"),
    h("p", null, "Wenn Sie diesen Vertrag widerrufen, erstatten wir alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben).")
  );

  const W4 = h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
    h("h2", { className: "font-semibold text-lg mb-2" }, "Ausschluss- bzw. Erlöschensgründe"),
    h("p", null, "Das Widerrufsrecht besteht u. a. nicht bei schnell verderblichen Waren oder versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, wenn ihre Versiegelung nach der Lieferung entfernt wurde.")
  );

  
  const W5 = h("section", { className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm" },
    h("h2", { className: "font-semibold text-lg mb-2" }, "Rücksendung / Retouren Ablauf"),
    h("ol", { className: "list-decimal pl-5 space-y-1" },
      h("li", null, "Widerruf innerhalb von 14 Tagen erklären – nutzen Sie gern unser ", h("a", { href: "/widerruf/formular", className: "underline" }, "Muster-Formular"), "."),
      h("li", null, "Ware sorgfältig verpacken (möglichst Originalverpackung)."),
      h("li", null, "Rücksendeadresse: ", h("br"), (s.withdrawal_company || "[Unternehmensname]"), ", ", (s.withdrawal_address || "[Anschrift]")),
      h("li", null, "Bitte legen Sie eine Notiz mit Bestellnummer bei, damit wir die Zuordnung beschleunigen können."),
      h("li", null, "Nach Wareneingang erstatten wir die Zahlung über die ursprüngliche Zahlungsart.")
    ),
    h("p", { className: "text-sm text-neutral-500 mt-2" }, "Hinweis: Sie tragen die unmittelbaren Kosten der Rücksendung der Waren, sofern nicht anders ausgewiesen.")
  );


  return h(LegalShell, { title: "Widerrufsbelehrung", subtitle: "Ihr Recht auf Widerruf (14 Tage)" }, W1, W2, W3, W4);
}
