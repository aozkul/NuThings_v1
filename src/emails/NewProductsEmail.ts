export interface CampaignProduct {
  id: string;
  title: string;                  // products.name
  desc: string;                   // products.description
  price: number | string;
  image?: string | null;          // products.image_url (opsiyonel)
  url: string;                    // ✅ API’de hazır veriyoruz
}

export function NewProductsEmail(params: {
  products: CampaignProduct[];
  subject: string;
  intro?: string;
  logoUrl?: string;
}) {
  const {products, subject, intro, logoUrl} = params;

  const logo =
    logoUrl ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_EMAIL_LOGO_URL : undefined) ||
    "https://eouodqzlcwgnlocjfpho.supabase.co/storage/v1/object/public/product-images/logo/logo.png";

  const year = new Date().getFullYear();

  const items = products
    .map((p) => {
      const leftCell = p.image
        ? `<td style="width:96px; vertical-align:top; padding-right:14px;">
             <img src="${p.image}" alt="${escapeHtml(p.title)}" width="96" height="96"
                  style="display:block; border-radius:8px; object-fit:cover;" />
           </td>`
        : "";

      return `
        <tr>
          <td style="padding:16px 20px; border-bottom:1px solid #eee;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
              <tr>
                ${leftCell}
                <td style="vertical-align:top;">
                  <h3 style="margin:0 0 6px; font-size:16px; color:#111;">
                    ${escapeHtml(p.title)}
                  </h3>
                  <p style="margin:0 8px 10px 0; font-size:13px; color:#555; line-height:1.5;">
                    ${escapeHtml(p.desc || "")}
                  </p>
                  <p style="margin:0 0 10px; font-weight:600; font-size:14px; color:#111;">
                    ${String(p.price)} €
                  </p>
                  <a href="${p.url}"
                     style="display:inline-block; background:#111; color:#fff; text-decoration:none; padding:8px 12px; border-radius:6px; font-size:13px;">
                    Ürünü İncele
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background:#f7f7f8;">
  <table role="presentation" width="100%" style="border-collapse:collapse; background:#f7f7f8; padding:20px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" style="width:600px; max-width:100%; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05)">
        <tr>
          <td style="padding:20px; text-align:center; background:#fff;">
            <img src="${logo}" alt="NuThings" width="120" height="50"
                 style="display:block; margin:0 auto 10px; max-width:100%; height:auto;" />
            <h2 style="margin:10px 0 0; font-size:22px; color:#111;">
              ${escapeHtml(subject)}
            </h2>
          </td>
        </tr>

        ${
    intro
      ? `<tr><td style="padding:0 20px 14px; font-size:14px; color:#444;">${escapeHtml(
        intro
      )}</td></tr>`
      : ""
  }

        ${items}

        <tr>
          <td style="padding:18px 20px; background:#fafafa; text-align:center; font-size:12px; color:#666;">
            © ${year} NuThings. Tüm hakları saklıdır.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Basit HTML escape */
function escapeHtml(str: string) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
