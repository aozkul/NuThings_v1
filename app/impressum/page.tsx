import React, {createElement as h} from "react";
import LegalShell from "@/src/components/legal/LegalShell";
import {getSettings} from "@/src/lib/settings";

export const metadata = {title: "Impressum | Nut Things"};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const s = await getSettings([
    "legal_company_name", "legal_address_street", "legal_address_zipcity",
    "legal_contact_phone", "legal_contact_email", "legal_register", "legal_vat_id", "legal_content_responsible",
  ]);

  const Dienstanbieter = h("p", null,
    h("strong", null, "Dienstanbieter:"), h("br"),
    s.legal_company_name || "[Unternehmensname / Inhaber]", h("br"),
    s.legal_address_street || "[Straße Hausnummer]", h("br"),
    s.legal_address_zipcity || "[PLZ Ort, Deutschland]"
  );

  const Kontakt = h("p", null,
    h("strong", null, "Kontakt:"), h("br"),
    "Telefon: ", (s.legal_contact_phone || "[Telefonnummer]"), h("br"),
    "E-Mail: ", (s.legal_contact_email || "[E-Mail-Adresse]")
  );

  const RegSteuern = (s.legal_register || s.legal_vat_id)
    ? h("p", null,
      h("strong", null, "Register & Steuern:"), h("br"),
      s.legal_register ? ["Handelsregister: ", s.legal_register, h("br")] : null,
      s.legal_vat_id ? ["USt-IdNr.: ", s.legal_vat_id] : null
    )
    : null;

  const Verantwortlich = s.legal_content_responsible
    ? h("p", null,
      h("strong", null, "Inhaltlich Verantwortliche/r gem. § 18 Abs. 2 MStV:"), h("br"),
      s.legal_content_responsible
    )
    : null;

  const HaftungInhalte = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Haftung für Inhalte"),
    h("p", null, "Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.")
  );

  const HaftungLinks = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Haftung für Links"),
    h("p", null, "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte übernehmen wir keine Gewähr.")
  );

  const Urheberrecht = h("section", {className: "bg-white border rounded-2xl p-4 md:p-5 shadow-sm"},
    h("h2", {className: "font-semibold text-lg mb-2"}, "Urheberrecht"),
    h("p", null, "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.")
  );

  return h(LegalShell, {
    title: "Impressum", subtitle: "Pflichtangaben gemäß §5 TMG", children: [
      Dienstanbieter,
      Kontakt,
      RegSteuern,
      Verantwortlich,
      HaftungInhalte,
      HaftungLinks,
      Urheberrecht
    ]
  });
}
