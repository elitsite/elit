"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 12;

type Props = {
  products: Product[];
  locale: Locale;
};

/**
 * Client-side paginated product grid with numbered page buttons.
 * Used on category pages to avoid rendering all products at once.
 */
export default function PaginatedProductGrid({ products, locale }: Props) {
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const displayed = products.slice(start, start + PAGE_SIZE);

  function goTo(p: number) {
    setPage(p);
    // Scroll to top of the grid smoothly
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  /** Build the page number list, with ellipsis (-1) where skipped. */
  function getPageRange(): number[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    const range: number[] = [1];
    if (left > 2) range.push(-1);
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push(-2);
    range.push(totalPages);
    return range;
  }

  return (
    <>
      <div
        ref={gridRef}
        className="mt-10 grid grid-cols-2 gap-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4 scroll-mt-24"
      >
        {displayed.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav
          className="mt-12 flex items-center justify-center gap-1.5 sm:gap-2"
          aria-label="Pagination"
        >
          {/* Prev */}
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink/50 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>

          {/* Page numbers */}
          {getPageRange().map((p, idx) =>
            p < 0 ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 w-9 items-center justify-center text-sm text-ink/30"
              >
                ···
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  p === page
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/15 text-ink/60 hover:border-brand hover:text-brand"
                }`}
              >
                {p}
              </button>
            ),
          )}

          {/* Next */}
          <button
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-ink/50 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </nav>
      )}
    </>
  );
}
