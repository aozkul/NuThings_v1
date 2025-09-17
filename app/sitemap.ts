import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://nut-things.com/", changeFrequency: "weekly", priority: 1 },
    { url: "https://nut-things.com/products", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://nut-things.com/admin", changeFrequency: "monthly", priority: 0.2 },
  ];
}
