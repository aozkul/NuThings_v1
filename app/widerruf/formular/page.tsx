import React, {createElement as h} from "react";
import LegalShell from "@/src/components/legal/LegalShell";
import {getSettings} from "@/src/lib/settings";

export const metadata = {title: "Muster-Widerrufsformular | Nut Things"};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const s = await getSettings(["withdrawal_company", "withdrawal_address", "withdrawal_email"]);

  const Form = h("pre", {className: "whitespace-pre-wrap text-sm border rounded-lg p-4 bg-white"}, `An
${s.withdrawal_company || "[Unternehmensname]"}
${s.withdrawal_address || "[Anschrift]"}
E-Mail: ${s.withdrawal_email || "[E-Mail-Adresse]"}

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*):
— Bestellt am (*)/erhalten am (*):
— Name des/der Verbraucher(s):
— Anschrift des/der Verbraucher(s):
— Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):
— Datum:
(*) Unzutreffendes streichen.`);

  return h(LegalShell, {
    title: "Muster-Widerrufsformular", subtitle: "Vorlage zum Herunterladen und Ausfüllen", children: [
      Form
    ]
  });
}
