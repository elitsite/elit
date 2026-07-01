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
  
  // Pause on hover (desktop)
  const [isHovered, setIsHovered] = useState(false);
  // Pause from user interaction (touch, wheel, arrows) for 30 seconds
  const [isInteracted, setIsInteracted] = useState(false);
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserInteraction = useCallback(() => {
    setIsInteracted(true);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracted(false);
    }, 30000);
  }, []);

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

  // ── Auto-scroll step ───────────────────────────────────────────────────────
  const scrollStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : 280;
    
    // If we reached the end, scroll back to start
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: step, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const isPaused = isHovered || isInteracted;
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
  }, [isScrollable, autoScroll, isVisible, isHovered, isInteracted, index, scrollStep]);

  // ── Manual arrow navigation ────────────────────────────────────────────────
  const handleArrow = useCallback((dir: "left" | "right") => {
    handleUserInteraction();
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  // ── Early return after all hooks ───────────────────────────────────────────
  if (products.length === 0) return null;

  const displayItems = products;

  const gridClass =
    gridCols === 2 ? "grid-cols-2"
    : gridCols === 3 ? "grid-cols-2 sm:grid-cols-3"
    : gridCols === 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
    : "grid-cols-2 sm:grid-cols-4"; // default 4

  return (
    <section
      ref={sectionRef}
      className="mx-auto my-12 max-w-6xl px-4 sm:my-20 sm:px-6 lg:px-8"
    >
      {/* Section Header */}
      <div className="relative mb-6 flex items-center justify-between sm:mb-10">
        <h2 className="flex-1 text-center font-display text-xl px-16 sm:px-0 font-medium tracking-tight text-ink sm:text-2xl lg:text-3xl">
          {t(labelKey)}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="absolute right-0 group flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/60 transition-colors hover:text-brand sm:gap-1.5 sm:text-[10px]"
          >
            {tHome("view_all")}
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Carousel / Grid */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          onTouchStart={handleUserInteraction}
          onWheel={handleUserInteraction}
          className={
            isScrollable
              ? "no-scrollbar flex gap-3 overflow-x-auto pb-3 sm:gap-5 sm:pb-5 snap-x snap-mandatory"
              : `grid gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-10 lg:gap-x-8 lg:gap-y-14 ${gridClass}`
          }
        >
          {displayItems.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              className={
                isScrollable
                  ? "w-[170px] shrink-0 sm:w-[220px] lg:w-[260px] snap-start"
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
