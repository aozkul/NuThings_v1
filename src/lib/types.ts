export type Category = {
  id: string;
  name: string;
  slug?: string | null;
  image_url?: string | null;
  image_alt?: string | null;   // <-- eklendi
  position?: number | null;
  tagline?: string | null;
  description?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  image_alt?: string | null;   // <-- eklendi
  category_id?: string | null;
  is_featured?: boolean | null;
  likes?: number | null;
  views?: number | null;
  seo_title?: string | null;
  seo_desc?: string | null;
  important_html?: string | null;
};

export type Setting = { key: string; value: string | null };


export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  image_alt?: string | null;
  position?: number | null;
};
