import Link from "next/link";
import {supabaseServer} from "@/src/lib/supabaseServer";
import {MailIcon, InstagramIcon, TwitterIcon, PhoneIcon} from "@/src/components/Icons";
import NewsletterBox from "@/src/components/footer/NewsletterBox";
import CookieSettingsButton from "@/src/components/cookie/CookieSettingsButton";


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
      className={`h-7 w-7 grid place-items-center rounded-xl ${bg} ${color} shrink-0`}
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
    .select("key, value")
    .in("key", [
      "social_instagram",
      "social_twitter",
      "social_email",
      "social_phone",
      "site_tagline"
    ]);

  const settings = Object.fromEntries(
    (settingsRows || []).map(r => [r.key, (r.value || "").trim()])
  );

  const instagramUrl = settings["social_instagram"] || "https://instagram.com";
  const twitterUrl = settings["social_twitter"] || "https://twitter.com";
  const emailAddr = settings["social_email"] || "info@nut-things.com";
  const phoneNumber = settings["social_phone"] || "+49 172 8891010";
  const siteTagline = settings["site_tagline"] || "Doğadan sofranıza; lokum, kuruyemiş ve daha fazlası.";

  return (
    <footer className="border-t mt-12 bg-white">
      {/* tek satıra sığması için 6 kolon ve items-start */}
      <div className="container-tight py-10 grid md:grid-cols-6 gap-6 items-start">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="NuThings" className="h-10 w-10 rounded-full object-cover"/>
            <span className="font-semibold">NuThings</span>
          </div>
          <p className="text-sm font-semibold text-neutral-700">
            {siteTagline}
          </p>
        </div>

        {/* Hızlı Bağlantılar */}
        <div>
          <h4 className="font-medium mb-3">Hızlı Bağlantılar</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:underline">Ana Sayfa</Link></li>
            <li><Link href="/products" className="hover:underline">Ürünler</Link></li>
            <li><Link href="/contact" className="hover:underline">İletişim</Link></li>
            <li><Link href="/admin" className="hover:underline">Admin</Link></li>
          </ul>
        </div>

        {/* İletişim */}
        <div>
          <h4 className="font-medium mb-3">İletişim</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <IconBadge bg="bg-sky-50" color="text-sky-600" title="E-posta">
                <MailIcon className="h-4 w-4"/>
              </IconBadge>
              <a
                href={`mailto:${emailAddr}`}
                className="hover:underline whitespace-nowrap text-sm"
              >
                {emailAddr}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <IconBadge bg="bg-emerald-50" color="text-emerald-600" title="Telefon">
                <PhoneIcon className="h-4 w-4"/>
              </IconBadge>
              <a href={`tel:${phoneNumber}`} className="hover:underline">{phoneNumber}</a>
            </li>
          </ul>
        </div>

        {/* Sosyal */}
        <div>
          <h4 className="font-medium mb-3">Takipte Kalın</h4>
          <div className="flex gap-3">
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
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border px-2 py-2 hover:bg-neutral-50"
              aria-label="Twitter / X" title="Twitter / X"
            >
              <IconBadge bg="bg-sky-50" color="text-sky-600">
                <TwitterIcon className="h-4 w-4"/>
              </IconBadge>
            </a>
          </div>
        </div>

        {/* Newsletter – sosyalın yanında, iki kolon */}
        <div className="md:col-span-2">
          <NewsletterBox compact/>
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

      <div className="border-t py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} NuThings
      </div>
    </footer>
  );
}
