// src/components/Footer.tsx
import Link from "next/link";
import {supabaseServer} from "@/src/lib/supabaseServer";
import {MailIcon, InstagramIcon, FacebookIcon, PhoneIcon} from "@/src/components/Icons";
import NewsletterBox from "@/src/components/footer/NewsletterBox";

function IconBadge({
                     children, bg, color, title,
                   }: {
  children: React.ReactNode;
  bg: string;
  color: string;
  title?: string;
}) {
  return (
    <span
      className={`h-8 w-8 grid place-items-center rounded-xl ${bg} ${color} shrink-0`}
      aria-hidden="true"
      title={title}
    >
      {children}
    </span>
  );
}

export default async function Footer() {
  const supabase = supabaseServer();

  const {data: settingsRows} = await supabase
    .from("settings")
    .select("key,value")
    .in("key", [
      "social_instagram",
      "social_facebook",
      "social_email",
      "social_phone",
      "site_tagline",
      "site_tagline2",
    ]);

  const settings: Record<string, string> =
    Object.fromEntries((settingsRows || []).map((r: any) => [r.key, (r.value || "").trim()]));

  const instagramUrl = settings["social_instagram"] || "https://instagram.com";
  const facebookUrl = settings["social_facebook"] || "https://facebook.com";
  const emailAddr = settings["social_email"] || "info@nut-things.com";
  const phoneNumber = settings["social_phone"] || "+49 172 8891010";
  const siteTagline = settings["site_tagline"] || "Qualität, die man schmeckt – von NuThings";
  const siteTagline2 = settings["site_tagline2"] || siteTagline;

  return (
    <footer className="border-t mt-12 bg-white">
      {/* === Row 1: Two brand blocks side-by-side === */}
      <div className="container-tight py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Brand #1 */}
          <div className="rounded-2xl border bg-neutral-50/50 p-6">
            <div className="flex items-center gap-4">
              <img src="/logo.jpg" alt="NuThings" className="h-16 w-16 rounded-full object-cover"/>
              <div className="min-w-0">
                <div className="font-semibold text-lg leading-tight truncate">NuThings</div>
                <p className="mt-1 text-sm text-neutral-700">{siteTagline}</p>
              </div>
            </div>
          </div>

          {/* Brand #2 */}
          <div className="rounded-2xl border bg-neutral-50/50 p-6">
            <div className="flex items-center gap-4">
              <img src="/logo-vicens-color-2.png" alt="Torrons Vicens" className="h-16 w-16 rounded-full object-cover"/>
              <div className="min-w-0">
                <div className="font-semibold text-lg leading-tight truncate">Torrons Vicens</div>
                <p className="mt-1 text-sm text-neutral-700">{siteTagline2}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === Row 2: Links, Contact, Social, Newsletter === */}
      <div className="container-tight border-t pt-8 pb-6">
        <div className="grid md:grid-cols-12 gap-6">
          {/* Hızlı Bağlantılar (dar) */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Hızlı Bağlantılar</h4>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/" className="hover:underline">Ana Sayfa</Link></li>
              <li><Link href="/products" className="hover:underline">Ürünler</Link></li>
              <li><Link href="/contact" className="hover:underline">İletişim</Link></li>
              <li><Link href="/admin" className="hover:underline">Admin</Link></li>
            </ul>
          </div>

          {/* İletişim */}
          <div className="md:col-span-3">
            <h4 className="font-semibold mb-2">İletişim</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <IconBadge bg="bg-blue-50" color="text-blue-600" title="E-posta">
                  <MailIcon className="h-4 w-4"/>
                </IconBadge>
                <a href={`mailto:${emailAddr}`} className="hover:underline">{emailAddr}</a>
              </li>
              <li className="flex items-center gap-3">
                <IconBadge bg="bg-green-50" color="text-green-600" title="Telefon">
                  <PhoneIcon className="h-4 w-4"/>
                </IconBadge>
                <a href={`tel:${phoneNumber.replace(/\s+/g, "")}`} className="hover:underline">
                  {phoneNumber}
                </a>
              </li>
            </ul>
          </div>

          {/* Sosyal (kompakt) */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Takipte Kalın</h4>
            <div className="flex gap-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border px-2 py-2 hover:bg-neutral-50"
                aria-label="Instagram" title="Instagram"
              >
                <IconBadge bg="bg-fuchsia-50" color="text-fuchsia-600">
                  <InstagramIcon className="h-4 w-4"/>
                </IconBadge>
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border px-2 py-2 hover:bg-neutral-50"
                aria-label="Facebook" title="Facebook"
              >
                <IconBadge bg="bg-blue-50" color="text-blue-600">
                  <FacebookIcon className="h-4 w-4"/>
                </IconBadge>
              </a>
            </div>
          </div>

          {/* Newsletter (geniş) */}
          <div className="md:col-span-5">
            <div className="rounded-2xl border bg-neutral-50/50 p-4 w-full max-w-4xl md:ml-auto">
              <NewsletterBox compact/>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="container-tight px-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-neutral-600 py-3 border-t">
          <a className="hover:underline" href="/impressum">Impressum</a>
          <a className="hover:underline" href="/datenschutz">Datenschutzerklärung</a>
          <a className="hover:underline" href="/agb">AGB</a>
          <a className="hover:underline" href="/widerruf">Widerrufsbelehrung</a>
          <a className="hover:underline" href="/versand-zahlung">Versand & Zahlung</a>
        </div>
      </div>

      <div className="border-t py-3 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} NuThings
      </div>
    </footer>
  );
}
