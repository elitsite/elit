"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Menu,
  X,
  ShoppingBag,
  Phone,
  Instagram,
  Facebook,
  Send,
} from "lucide-react";
import WhatsAppIcon from "./icons/WhatsAppIcon";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { BRAND_NAME } from "@/lib/site";
import { useCart } from "@/lib/cart";
import LanguageSwitcher from "./LanguageSwitcher";
import CategoryNav from "./CategoryNav";
import CartDrawer from "./CartDrawer";
import CartOrderModal from "./CartOrderModal";

export type HeaderContact = {
  phone?: string;
  instagram_link?: string;
  facebook_link?: string;
  whatsapp_link?: string;
  telegram_link?: string;
};

export default function Header({ contact }: { contact?: HeaderContact }) {
  const t = useTranslations("Nav");
  const { totalQuantity } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the menu drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleCheckout = () => {
    setCartOpen(false);
    setOrderOpen(true);
  };

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
              className="h-[72px] w-auto sm:h-20"
            />
          </Link>

          {/* Right: language + cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={t("cart")}
              className="relative rounded-full p-2 text-ink transition-colors hover:text-brand"
            >
              <ShoppingBag size={21} strokeWidth={1.5} />
              {totalQuantity > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-cream">
                  {totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Catalog menu drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40"
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

              {/* Bottom: social links + call button */}
              {(contact?.instagram_link ||
                contact?.facebook_link ||
                contact?.whatsapp_link ||
                contact?.telegram_link ||
                contact?.phone) && (
                <div className="shrink-0 space-y-4 border-t border-black/5 px-5 py-5">
                  {(contact?.instagram_link ||
                    contact?.facebook_link ||
                    contact?.whatsapp_link ||
                    contact?.telegram_link) && (
                    <div className="flex items-center gap-3">
                      {contact?.instagram_link && (
                        <a
                          href={contact.instagram_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-ink/60 transition-colors hover:border-brand hover:text-brand"
                        >
                          <Instagram size={18} strokeWidth={1.5} />
                        </a>
                      )}
                      {contact?.whatsapp_link && (
                        <a
                          href={contact.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="WhatsApp"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-ink/60 transition-colors hover:border-brand hover:text-brand"
                        >
                          <WhatsAppIcon size={18} />
                        </a>
                      )}
                      {contact?.telegram_link && (
                        <a
                          href={contact.telegram_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Telegram"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-ink/60 transition-colors hover:border-brand hover:text-brand"
                        >
                          <Send size={18} strokeWidth={1.5} />
                        </a>
                      )}
                      {contact?.facebook_link && (
                        <a
                          href={contact.facebook_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook"
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-ink/60 transition-colors hover:border-brand hover:text-brand"
                        >
                          <Facebook size={18} strokeWidth={1.5} />
                        </a>
                      )}
                    </div>
                  )}

                  {contact?.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                      className="flex w-full items-center justify-center gap-2 border border-ink/30 px-6 py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream"
                    >
                      <Phone size={16} strokeWidth={1.5} />
                      {t("call")}
                    </a>
                  )}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Order modal */}
      <CartOrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
      />
    </>
  );
}
