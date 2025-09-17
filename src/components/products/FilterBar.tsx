"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {useCallback, useMemo} from "react";
import {useI18n} from "@/src/i18n/provider";

type Category = { id: string; name: string };
type Props = { categories: Category[]; };

function setParam(url: URL, key: string, value?: string | null) {
  if (!value) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
}

export default function FilterBar({categories}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();

  const currentCategory = params.get("category_id") || "";
  const currentSort = params.get("sort") || "most_liked";

  const sorts = useMemo(() => ([
    { value: "most_liked", label: t("common", "sort_most_liked") || "Most Liked" },
    { value: "name", label: t("common", "sort_name") || "Name (A–Z)" },
    { value: "price_asc", label: t("common", "sort_price_asc") || "Price (Low→High)" },
    { value: "price_desc", label: t("common", "sort_price_desc") || "Price (High→Low)" },
  ]), [t]);

  const onChange = useCallback((key: "category_id" | "sort", value: string) => {
    const url = new URL(window.location.href);
    setParam(url, key, value || null);
    router.replace(url.pathname + url.search);
    // scroll to top smooth for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router]);

  return (
    <div className="mb-6 rounded-2xl border bg-white/70 backdrop-blur px-4 py-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Category */}
        <div className="flex items-center gap-2">
          <label htmlFor="category" className="w-28 text-sm text-neutral-600">
            {t("common","category") || "Category"}
          </label>
          <select
            id="category"
            value={currentCategory}
            onChange={(e)=> onChange("category_id", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="">{t("common","all_categories") || "All categories"}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="w-28 text-sm text-neutral-600">
            {t("common","sort") || "Sort"}
          </label>
          <select
            id="sort"
            value={currentSort}
            onChange={(e)=> onChange("sort", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            {sorts.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
