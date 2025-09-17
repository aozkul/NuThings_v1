import ContactForm from "@/src/components/contact/ContactForm";
import {cookies} from "next/headers";

function t(ns: any, key: string, fb?: string) {
  const v = ns?.[key];
  return typeof v === "string" ? v : (fb ?? key);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactPage() {
  const jar = await cookies();
  const locale = (jar.get("lang")?.value as "de" | "tr" | "en") ?? "de";
  // ✅ messages proje kökünde: /messages/*.json
  const messages = (await import(`../../messages/${locale}.json`)).default as any;

  return (
    <div className="container-tight my-10">
      <h1 className="text-2xl font-semibold mb-4">
        {t(messages.navbar, "contact", "İletişim")}
      </h1>
      <p className="text-neutral-700 mb-6">
        {t(
          messages.common,
          "sorularınız_için_formu_doldurun_en_kısa_sürede_dönüş_yapalım",
          "Sorularınız için formu doldurun; en kısa sürede dönüş yapalım."
        )}
      </p>
      <ContactForm/>
    </div>
  );
}
