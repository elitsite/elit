"use client";

import { useTranslations } from "next-intl";
import type { Product } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import ProductCard from "./ProductCard";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";

type Props = {
  labelKey: string;
  products: Product[];
  locale: Locale;
  viewAllHref?: string;
  gridCols?: 2 | 3 | 4 | 5;
  isScrollable?: boolean;
  autoScroll?: boolean;
  /** Stagger index — delays the start so multiple carousels don't move simultaneously. */
  index?: number;
};

const INTERVAL_MS = 5000; // auto-advance every 5 s
const STAGGER_MS  = 1700; // gap between carousels

export default function CategorySection({
  labelKey,
  products,
  locale,
  viewAllHref,
  gridCols = 4,
  isScrollable = false,
  autoScroll = false,
  index = 0,
}: Props) {
  const t     = useTranslations("Categories");
  const tHome = useTranslations("Home");

  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  // Whether the section is currently in the viewport
  const [isVisible, setIsVisible] = useState(false);
  // Pause on hover / touch
  const [isPaused, setIsPaused] = useState(false);

  // ── Intersection Observer — only auto-scroll while visible ─────────────────
  useEffect(() => {
    if (!isScrollable || !autoScroll) return;
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isScrollable, autoScroll]);

  // ── Initialise scroll at middle copy (for seamless loop) ───────────────────
  useEffect(() => {
    if (!isScrollable || !scrollRef.current) return;
    const el = scrollRef.current;
    // Start at the beginning of the second (middle) copy
    requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth / 3;
    });
  }, [isScrollable]);

  // ── Seamless loop: silently jump when reaching outer copies ────────────────
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !isScrollable) return;
    const third = el.scrollWidth / 3;
    if (el.scrollLeft >= third * 2) {
      el.scrollLeft -= third; // jumped past end → land in middle
    } else if (el.scrollLeft < 4) {
      el.scrollLeft += third; // scrolled before start → land in middle
    }
  }, [isScrollable]);

  // ── Auto-scroll step ───────────────────────────────────────────────────────
  const scrollStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by roughly one card width
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 280;
    el.scrollBy({ left: step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!isScrollable || !autoScroll || !isVisible || isPaused) return;

    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      scrollStep();
      intervalId = setInterval(scrollStep, INTERVAL_MS);
    }, index * STAGGER_MS);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isScrollable, autoScroll, isVisible, isPaused, index, scrollStep]);

  // ── Manual arrow navigation ────────────────────────────────────────────────
  const handleArrow = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  // ── Early return after all hooks ───────────────────────────────────────────
  if (products.length === 0) return null;

  // For infinite scroll, render items three times
  const displayItems = isScrollable
    ? [...products, ...products, ...products]
    : products;

  const gridClass =
    gridCols === 2 ? "grid-cols-2"
    : gridCols === 3 ? "grid-cols-2 sm:grid-cols-3"
    : gridCols === 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
    : "grid-cols-2 sm:grid-cols-4"; // default 4

  return (
    <section
      ref={sectionRef}
      className="mx-auto mb-10 max-w-6xl px-4 sm:mb-20 sm:px-6 lg:px-8"
    >
      {/* Section Header */}
      <div className="relative mb-5 flex items-center sm:mb-8">
        <h2 className="flex-1 text-center font-display text-xl font-medium text-ink sm:text-2xl lg:text-3xl">
          {t(labelKey)}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="absolute right-0 group flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-ink/60 transition-colors hover:text-brand sm:gap-1.5 sm:text-[10px] lg:text-[11px]"
          >
            {tHome("view_all")}
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Carousel / Grid */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 1200)}
      >
        {/* Arrows — always visible on scrollable sections */}
        {isScrollable && (
          <>
            <button
              onClick={() => handleArrow("left")}
              aria-label="Previous"
              className="absolute -left-1 top-[38%] z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-1.5 text-ink/50 shadow-md backdrop-blur-sm transition-all hover:text-brand active:scale-95 sm:-left-3 sm:p-2 lg:-left-4"
            >
              <ChevronLeft size={18} strokeWidth={1.5} className="sm:hidden" />
              <ChevronLeft size={22} strokeWidth={1.5} className="hidden sm:block" />
            </button>
            <button
              onClick={() => handleArrow("right")}
              aria-label="Next"
              className="absolute -right-1 top-[38%] z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-1.5 text-ink/50 shadow-md backdrop-blur-sm transition-all hover:text-brand active:scale-95 sm:-right-3 sm:p-2 lg:-right-4"
            >
              <ChevronRight size={18} strokeWidth={1.5} className="sm:hidden" />
              <ChevronRight size={22} strokeWidth={1.5} className="hidden sm:block" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          onScroll={isScrollable ? onScroll : undefined}
          className={
            isScrollable
              ? "no-scrollbar flex gap-3 overflow-x-auto pb-3 sm:gap-5 sm:pb-5"
              : `grid gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-10 lg:gap-x-8 lg:gap-y-14 ${gridClass}`
          }
        >
          {displayItems.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              className={
                isScrollable
                  ? "w-[170px] shrink-0 sm:w-[220px] lg:w-[260px]"
                  : "w-full"
              }
            >
              <ProductCard product={product} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
