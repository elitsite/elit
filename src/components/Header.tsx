"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { BRAND_NAME } from "@/lib/site";
import LanguageSwitcher from "./LanguageSwitcher";
import CategoryNav from "./CategoryNav";

export default function Header() {
  const t = useTranslations("Nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
          scrolled
            ? "border-b border-black/5 bg-cream/90 backdrop-blur-md"
            : "bg-cream"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-content items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
            className="flex items-center gap-2 rounded-full px-2 py-2 text-ink transition-colors hover:text-brand"
          >
            <Menu size={22} strokeWidth={1.5} />
            <span className="hidden text-xs font-medium uppercase tracking-[0.2em] sm:inline">
              {t("menu")}
            </span>
          </button>

          {/* Center: brand logo */}
          <Link
            href="/"
            aria-label={BRAND_NAME}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <Image
              src="/logo.png"
              alt={BRAND_NAME}
              width={1610}
              height={977}
              priority
              className="h-14 w-auto sm:h-16"
            />
          </Link>

          {/* Right: language + cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link
              href="/cart"
              aria-label={t("cart")}
              className="relative rounded-full p-2 text-ink transition-colors hover:text-brand"
            >
              <ShoppingBag size={21} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </header>

      {/* Drawer menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-cream shadow-2xl"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/5 px-5">
                <span className="font-display text-2xl font-medium text-ink">
                  {t("catalog")}
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label={t("close")}
                  className="rounded-full p-2 text-ink transition-colors hover:text-brand"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>
              <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
                <CategoryNav onNavigate={() => setMenuOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
