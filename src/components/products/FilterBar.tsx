"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {useCallback, useMemo, useEffect, useRef} from "react";

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
  sort_admin: string;
};

type SortKey = "name" | "price_asc" | "price_desc" | "most_liked" | "admin_order";

export default function FilterBar({
                                    labels,
                                    categories,
                                    showCategory = true,
                                    selectedCategoryId = "",
                                    selectedSort = "most_liked",
                                  }: {
  labels: Labels;
  categories: Category[];
  showCategory?: boolean;
  selectedCategoryId?: string;
  selectedSort?: SortKey;
}) {
  const router = useRouter();
  const params = useSearchParams();

  // URL’den oku; yoksa prop’a düş
  const urlCategory = params.get("category_id") ?? "";
  const urlSort = (params.get("sort") as SortKey | null) ?? null;

  const currentCategory = urlCategory || selectedCategoryId || "";
  const currentSort: SortKey = urlSort || selectedSort || "most_liked";

  const sorts = useMemo(
    () => [
      {value: "admin_order", label: labels.sort_admin},
      {value: "most_liked", label: labels.sort_most_liked},
      {value: "price_asc", label: labels.sort_price_asc},
      {value: "price_desc", label: labels.sort_price_desc},
      {value: "name", label: labels.sort_name},
    ],
    [labels]
  );

  const setParam = useCallback(
    (key: "category_id" | "sort", value: string) => {
      const search = new URLSearchParams(params.toString());
      if (!value) search.delete(key);
      else search.set(key, value);
      router.push(`?${search.toString()}`);
    },
    [params, router]
  );

  // ---- ikonlar ----
  const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.24 3.36a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z"/>
    </svg>
  );
  const FunnelIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6l-5.6 7.47V19a1 1 0 0 1-1.45.9l-3-1.5A1 1 0 0 1 10 17v-3.93L4.2 5.6A1 1 0 0 1 3 5z"/>
    </svg>
  );

  // details dışı tıklamada kapat
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const d = detailsRef.current;
      if (!d) return;
      if (d.open && e.target instanceof Node && !d.contains(e.target)) d.open = false;
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const selectedSortLabel =
    sorts.find((s) => s.value === currentSort)?.label ?? sorts[0].label;

  return (
    <div
      className="w-full sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-neutral-200"
      role="region"
      aria-label={labels.title ?? "Filters"}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          {/* Kategori */}
          {showCategory && (
            <div className="w-full md:w-auto">
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                {labels.category}
              </label>

              <div className="relative">
                <select
                  value={currentCategory}
                  onChange={(e) => setParam("category_id", e.target.value)}
                  className="w-full md:w-72 appearance-none rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 pr-9 shadow-sm focus:outline-none focus:ring-4 focus:ring-neutral-200/60"
                  aria-label={labels.category}
                >
                  <option value="">{labels.all_categories}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-neutral-500"/>
              </div>
            </div>
          )}

          {/* Sıralama: mobil native, desktop premium dropdown */}
          <div className="w-full md:w-auto flex items-center gap-2 md:gap-3">
            {/* Mobile native select */}
            <div className="relative md:hidden w-full">
              <label className="sr-only">{labels.sort}</label>
              <select
                value={currentSort}
                onChange={(e) => setParam("sort", e.target.value)}
                className="w-full appearance-none rounded-2xl border border-neutral-200 bg-white pl-10 pr-9 py-2.5 shadow-sm focus:outline-none focus:ring-4 focus:ring-neutral-200/60"
                aria-label={labels.sort}
              >
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <FunnelIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-neutral-600"/>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-neutral-500"/>
            </div>

            {/* Desktop fancy dropdown */}
            <details ref={detailsRef} className="group relative hidden md:block">
              <summary
                className="list-none select-none inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 shadow-sm hover:shadow focus:outline-none focus:ring-4 focus:ring-neutral-200/60 cursor-pointer"
                aria-label={labels.sort}
              >
                <FunnelIcon className="h-4 w-4 fill-neutral-700"/>
                <span className="text-sm font-medium text-neutral-800">
                  {labels.sort}: <span className="font-semibold">{selectedSortLabel}</span>
                </span>
                <ChevronDown
                  className="h-4 w-4 fill-neutral-500 transition-transform duration-200 group-open:rotate-180"/>
              </summary>

              <div
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg ring-1 ring-black/5"
                role="menu"
                aria-label={labels.sort}
              >
                <ul className="max-h-80 overflow-auto py-2">
                  {sorts.map((s) => {
                    const active = s.value === currentSort;
                    return (
                      <li key={s.value}>
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => {
                            setParam("sort", s.value);
                            if (detailsRef.current) detailsRef.current.open = false;
                          }}
                          className={[
                            "w-full text-left px-3.5 py-2.5 text-sm",
                            active ? "bg-neutral-100 font-semibold" : "hover:bg-neutral-50",
                          ].join(" ")}
                        >
                          {s.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
