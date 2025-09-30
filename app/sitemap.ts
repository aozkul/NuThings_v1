import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [

{ url: "https://nut-things.com/impressum", changeFrequency: "yearly", priority: 0.3 },
{ url: "https://nut-things.com/datenschutz", changeFrequency: "yearly", priority: 0.3 },
{ url: "https://nut-things.com/agb", changeFrequency: "yearly", priority: 0.3 },
{ url: "https://nut-things.com/widerruf", changeFrequency: "yearly", priority: 0.3 },
{ url: "https://nut-things.com/widerruf/formular", changeFrequency: "yearly", priority: 0.2 },
{ url: "https://nut-things.com/versand-zahlung", changeFrequency: "yearly", priority: 0.3 },
{ url: "https://nut-things.com/cookies", changeFrequency: "yearly", priority: 0.2 },
{ url: "https://nut-things.com/contact", changeFrequency: "yearly", priority: 0.2 },

    { url: "https://nut-things.com/", changeFrequency: "weekly", priority: 1 },
    { url: "https://nut-things.com/products", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://nut-things.com/admin", changeFrequency: "monthly", priority: 0.2 },
  ];
}
