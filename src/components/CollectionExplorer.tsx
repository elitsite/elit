"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  normalizePriceFilters,
  type PriceFilter,
  type Product,
} from "@/lib/supabase";
import { finalPrice, localizeProduct } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";
import ProductCard from "./ProductCard";

type SortType = "newest" | "price_asc" | "price_desc" | "name_asc";

/** Homepage collections shown as category chips (leaf slug → Categories label). */
const COLLECTIONS = [
  { slug: "mono-bouquets", labelKey: "mono_bouquets" },
  { slug: "mixed-bouquets", labelKey: "mixed_bouquets" },
  { slug: "box-arrangements", labelKey: "box_arrangements" },
  { slug: "basket-arrangements", labelKey: "basket_arrangements" },
] as const;

const PAGE_SIZE = 12;

type Props = {
  products: Product[];
  locale: Locale;
  /** Raw price filters from settings (falls back to defaults). */
  priceFilters?: PriceFilter[];
};

/**
 * Filterable catalog for the homepage "Discover our collections" section.
 * Ports the barvinok filter logic (search + price + sort + category) and
 * adapts it to the Elite Bloemen visual language.
 */
export default function CollectionExplorer({
  products,
  locale,
  priceFilters,
}: Props) {
  const t = useTranslations("Catalog");
  const tCat = useTranslations("Categories");

  const [activeCategory, setActiveCategory] = useState("all");
  const [activePriceRange, setActivePriceRange] = useState("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Localize once so search & sort operate on the active-locale text.
  const localized = useMemo(
    () =>
      products.map((product) => ({
        product,
        view: localizeProduct(product, locale),
      })),
    [products, locale],
  );

  // Dynamic price ranges from settings (with sensible defaults).
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

  // Reset a dead price filter if settings changed underneath it.
  useEffect(() => {
    if (
      activePriceRange !== "all" &&
      !priceRanges.find((r) => r.id === activePriceRange)
    ) {
      setActivePriceRange("all");
    }
  }, [priceRanges, activePriceRange]);

  // Only show category chips for collections that actually have products.
  const availableCategories = useMemo(() => {
    const present = new Set(products.map((p) => p.category));
    return COLLECTIONS.filter((c) => present.has(c.slug));
  }, [products]);

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
  }, [
    localized,
    activeCategory,
    activePriceRange,
    searchQuery,
    sortType,
    priceRanges,
  ]);

  const display = filtered.slice(0, visibleCount);
  const hasMore = display.length < filtered.length;
  const hasActiveFilters =
    activeCategory !== "all" ||
    activePriceRange !== "all" ||
    sortType !== "newest" ||
    !!searchQuery;

  // Reset pagination whenever filters change.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
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
    `px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] border transition-colors ${
      active
        ? "border-brand bg-brand text-cream"
        : "border-ink/20 text-ink/60 hover:border-brand hover:text-brand"
    }`;

  const labelClass =
    "mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/40";

  return (
    <div>
      {/* Filter panel */}
      <div className="mb-8 space-y-5 border border-black/5 bg-white p-5 sm:p-6">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full border border-ink/15 bg-cream/40 py-3 pl-11 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none"
          />
        </div>

        {/* Category */}
        {availableCategories.length > 1 && (
          <div>
            <p className={labelClass}>{t("category_label")}</p>
            <div className="flex flex-wrap gap-2">
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

        {/* Price */}
        <div>
          <p className={labelClass}>{t("price_filter")}</p>
          <div className="flex flex-wrap gap-2">
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

        {/* Sort */}
        <div>
          <p className={labelClass}>{t("sort_label")}</p>
          <div className="flex flex-wrap gap-2">
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

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs font-medium uppercase tracking-[0.15em] text-brand-dark transition-colors hover:text-brand"
          >
            {t("reset")}
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="mb-6 text-xs uppercase tracking-[0.2em] text-ink/50">
        {t("count", { count: filtered.length })}
      </p>

      {display.length === 0 ? (
        <p className="py-20 text-center text-ink/50">{t("empty")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {display.map((x) => (
              <ProductCard key={x.product.id} product={x.product} locale={locale} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="border border-ink/30 px-9 py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream"
              >
                {t("load_more")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
