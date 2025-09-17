"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {useCallback, useMemo} from "react";

type Category = { id: string; name: string };

type Labels = {
  title?: string;
  category: string;
  sort: string;
  all_categories: string;
  sort_name: string;
  sort_price_asc: string;
  sort_price_desc: string;
  sort_most_liked: string;
};

type Props = {
  categories: Category[];
  labels: Labels;
  showCategory?: boolean; // kategori sayfasında false geçiyoruz
  selectedCategoryId?: string;
  selectedSort?: "name" | "price_asc" | "price_desc" | "most_liked";
};

function setParam(url: URL, key: string, value?: string | null) {
  if (!value) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
}

export default function FilterBar({
                                    categories,
                                    labels,
                                    showCategory = true,
                                    selectedCategoryId = "",
                                    selectedSort = "most_liked",
                                  }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const currentCategory =
    (params.get("category_id") ?? selectedCategoryId) || "";
  const currentSort =
    ((params.get("sort") as Props["selectedSort"]) ?? selectedSort) ||
    "most_liked";

  const sorts = useMemo(
    () => [
      {value: "most_liked", label: labels.sort_most_liked},
      {value: "name", label: labels.sort_name},
      {value: "price_asc", label: labels.sort_price_asc},
      {value: "price_desc", label: labels.sort_price_desc},
    ],
    [labels]
  );

  const onChange = useCallback(
    (key: "category_id" | "sort", value: string) => {
      const url = new URL(window.location.href);
      setParam(url, key, value || null);
      router.replace(url.pathname + url.search);
      window.scrollTo({top: 0, behavior: "smooth"});
    },
    [router]
  );

  return (
    <div className="mb-6 rounded-2xl border bg-white/70 backdrop-blur px-4 py-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Category */}
        {showCategory && (
          <div className="flex items-center gap-2">
            <label htmlFor="category" className="w-28 text-sm text-neutral-600">
              {labels.category}
            </label>
            <select
              id="category"
              value={currentCategory}
              onChange={(e) => onChange("category_id", e.target.value)}
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            >
              <option value="">{labels.all_categories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="w-28 text-sm text-neutral-600">
            {labels.sort}
          </label>
          <select
            id="sort"
            value={currentSort}
            onChange={(e) => onChange("sort", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
