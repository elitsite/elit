import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Instagram, Facebook } from "lucide-react";
import WhatsAppIcon from "./icons/WhatsAppIcon";

/**
 * Clean, structured footer matching the new Alya Bloemen design.
 */
export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const tCat = useTranslations("Categories");

  return (
    <footer className="border-t border-black/5 bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:gap-24">
          {/* Brand Logo */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Alya Bloemen"
                width={120}
                height={60}
                className="h-14 w-auto opacity-90 transition-opacity hover:opacity-100"
              />
            </Link>
          </div>

          {/* Menu */}
          <div>
            <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
              {t("menu")}
            </h4>
            <ul className="space-y-3 text-[13px] text-ink/60">
              <li><Link href="/" className="transition-colors hover:text-brand">{tNav("home")}</Link></li>
              <li><Link href="/category/bouquets" className="transition-colors hover:text-brand">{tNav("catalog")}</Link></li>
              <li><Link href="/category/weddings" className="transition-colors hover:text-brand">{tCat("weddings")}</Link></li>
              <li><Link href="/category/parties" className="transition-colors hover:text-brand">{tCat("parties")}</Link></li>
              <li><Link href="/about" className="transition-colors hover:text-brand">{tNav("about")}</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
              {t("customer_service")}
            </h4>
            <ul className="space-y-3 text-[13px] text-ink/60">
              <li><Link href="/delivery" className="transition-colors hover:text-brand">{t("delivery") || "Delivery"}</Link></li>
              <li><Link href="/payment" className="transition-colors hover:text-brand">{t("payment") || "Payment"}</Link></li>
              <li><Link href="/returns" className="transition-colors hover:text-brand">{t("returns") || "Returns"}</Link></li>
              <li><Link href="/faq" className="transition-colors hover:text-brand">{t("faq") || "FAQ"}</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-brand">{t("contact")}</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
              {t("contacts")}
            </h4>
            <ul className="space-y-3 text-[13px] text-ink/60">
              <li><a href="mailto:info@alyabloemen.nl" className="transition-colors hover:text-brand">info@alyabloemen.nl</a></li>
              <li><a href="tel:+31612345678" className="transition-colors hover:text-brand">+31 6 12345678</a></li>
              <li><p>Amsterdam, Netherlands</p></li>
            </ul>
            
            {/* Social Icons */}
            <div className="mt-8 flex items-center gap-5 text-ink/40">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-brand">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="transition-colors hover:text-brand">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a href="https://wa.me" target="_blank" rel="noreferrer" className="transition-colors hover:text-brand">
                <WhatsAppIcon size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 border-t border-black/5 pt-8 text-center text-[11px] text-ink/30 sm:mt-24 sm:text-left">
          <p>© {new Date().getFullYear()} Alya Bloemen. {t("rights")}.</p>
        </div>
      </div>
    </footer>
  );
}
