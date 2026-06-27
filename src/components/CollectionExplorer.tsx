"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  normalizePriceFilters,
  type PriceFilter,
  type Product,
} from "@/lib/supabase";
import { finalPrice, localizeProduct } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";
import { getLeafCategories } from "@/lib/categories";
import ProductCard from "./ProductCard";

type SortType = "newest" | "price_asc" | "price_desc" | "name_asc";

const PAGE_SIZE = 12;

type Props = {
  products: Product[];
  locale: Locale;
  priceFilters?: PriceFilter[];
  categories?: { slug: string; labelKey: string }[];
  pageSize?: number;
};

export default function CollectionExplorer({
  products,
  locale,
  priceFilters,
  categories,
  pageSize,
}: Props) {
  const t = useTranslations("Catalog");
  const tCat = useTranslations("Categories");

  const [activeCategory, setActiveCategory] = useState("all");
  const [activePriceRange, setActivePriceRange] = useState("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const activePageSize = pageSize || (isMobile ? 16 : 24);

  const localized = useMemo(
    () =>
      products.map((product) => ({
        product,
        view: localizeProduct(product, locale),
      })),
    [products, locale],
  );

  const validFilters = useMemo(
    () => normalizePriceFilters(priceFilters),
    [priceFilters],
  );
  const priceRanges = useMemo(() => {
    const sorted = [...validFilters].sort(
      (a, b) => (a.max ?? Infinity) - (b.max ?? Infinity),
    );
    return [
      { id: "all", label: t("price_any"), min: 0, max: Infinity },
      ...sorted.map((f) => {
        const id = `${f.min}-${f.max ?? "inf"}`;
        let label: string;
        if (f.min === 0 && f.max !== null) {
          label = t("price_up_to", { value: f.max });
        } else if (f.max === null) {
          label = t("price_from", { value: f.min });
        } else {
          label = t("price_range", { min: f.min, max: f.max });
        }
        return { id, label, min: f.min, max: f.max ?? Infinity };
      }),
    ];
  }, [validFilters, t]);

  useEffect(() => {
    if (
      activePriceRange !== "all" &&
      !priceRanges.find((r) => r.id === activePriceRange)
    ) {
      setActivePriceRange("all");
    }
  }, [priceRanges, activePriceRange]);

  const availableCategories = useMemo(() => {
    const present = new Set(products.map((p) => p.category));
    const all = categories || getLeafCategories();
    return all.filter((c) => present.has(c.slug));
  }, [products, categories]);

  const filtered = useMemo(() => {
    let list = [...localized];
    if (activeCategory !== "all") {
      list = list.filter((x) => x.product.category === activeCategory);
    }
    const range = priceRanges.find((r) => r.id === activePriceRange);
    if (range && activePriceRange !== "all") {
      list = list.filter((x) => {
        const fp = finalPrice(x.product.price, x.product.discount);
        return fp >= range.min && fp <= range.max;
      });
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (x) =>
          x.view.display.name.toLowerCase().includes(q) ||
          x.view.display.description.toLowerCase().includes(q),
      );
    }
    if (sortType === "price_asc") {
      list.sort(
        (a, b) =>
          finalPrice(a.product.price, a.product.discount) -
          finalPrice(b.product.price, b.product.discount),
      );
    } else if (sortType === "price_desc") {
      list.sort(
        (a, b) =>
          finalPrice(b.product.price, b.product.discount) -
          finalPrice(a.product.price, a.product.discount),
      );
    } else if (sortType === "name_asc") {
      list.sort((a, b) => a.view.display.name.localeCompare(b.view.display.name));
    }
    return list;
  }, [localized, activeCategory, activePriceRange, searchQuery, sortType, priceRanges]);

  const totalPages = Math.ceil(filtered.length / activePageSize);
  const display = filtered.slice((currentPage - 1) * activePageSize, currentPage * activePageSize);

  const hasActiveFilters =
    activeCategory !== "all" ||
    activePriceRange !== "all" ||
    sortType !== "newest" ||
    !!searchQuery;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activePriceRange, searchQuery, sortType]);

  const resetFilters = () => {
    setActiveCategory("all");
    setActivePriceRange("all");
    setSortType("newest");
    setSearchQuery("");
  };

  const sortOptions: { id: SortType; key: string }[] = [
    { id: "newest", key: "sort_newest" },
    { id: "price_asc", key: "sort_price_asc" },
    { id: "price_desc", key: "sort_price_desc" },
    { id: "name_asc", key: "sort_name" },
  ];

  const chipClass = (active: boolean) =>
    `px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] border rounded-full transition-colors ${
      active
        ? "border-brand bg-brand text-cream"
        : "border-ink/15 text-ink/50 hover:border-brand hover:text-brand"
    }`;

  const activeFilterCount = [
    activeCategory !== "all",
    activePriceRange !== "all",
    sortType !== "newest",
  ].filter(Boolean).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const el = document.getElementById("collection-explorer");
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div id="collection-explorer">
      {/* Compact filter bar */}
      <div className="mb-6 space-y-3">
        {/* Top row: search + filter toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full border border-ink/10 bg-white py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink/35 focus:border-brand focus:outline-none rounded-lg"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ${
              filtersOpen || hasActiveFilters
                ? "border-brand bg-brand/5 text-brand"
                : "border-ink/10 text-ink/50 hover:border-brand"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">{t("filters")}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-cream">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable filters */}
        {filtersOpen && (
          <div className="rounded-lg border border-ink/5 bg-white p-3 sm:p-4 space-y-3 animate-fade-in">
            {/* Price row */}
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/35">
                {t("price_filter")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {priceRanges.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActivePriceRange(r.id)}
                    className={chipClass(activePriceRange === r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort row */}
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/35">
                {t("sort_label")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sortOptions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortType(s.id)}
                    className={chipClass(sortType === s.id)}
                  >
                    {t(s.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category row */}
            {availableCategories.length > 1 && (
              <div>
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/35">
                  {t("category_label")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={chipClass(activeCategory === "all")}
                  >
                    {t("all_categories")}
                  </button>
                  {availableCategories.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => setActiveCategory(c.slug)}
                      className={chipClass(activeCategory === c.slug)}
                    >
                      {tCat(c.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.1em] text-brand transition-colors hover:text-brand-dark"
              >
                <X size={12} />
                {t("reset")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="mb-4 text-[10px] uppercase tracking-[0.15em] text-ink/40">
        {t("count", { count: filtered.length })}
      </p>

      {display.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/50">{t("empty")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {display.map((x) => (
              <ProductCard key={x.product.id} product={x.product} locale={locale} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 sm:mt-10">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 text-ink/50 transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-ink/20 disabled:hover:text-ink/50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    currentPage === p
                      ? "bg-brand text-cream"
                      : "border border-transparent text-ink/60 hover:border-ink/20 hover:text-ink"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 text-ink/50 transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-ink/20 disabled:hover:text-ink/50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
