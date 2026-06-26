import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Instagram, Facebook } from "lucide-react";
import WhatsAppIcon from "./icons/WhatsAppIcon";

export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");

  return (
    <footer className="border-t border-black/5 bg-cream py-10 text-sm sm:py-12">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
          {/* Brand tagline */}
          <div className="space-y-3">
            <h3 className="font-display text-xl font-medium text-ink">
              Alya Bloemen
            </h3>
            <p className="text-ink/50">{t("tagline")}</p>
          </div>

          {/* Collections */}
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-ink sm:mb-4">
              {t("collections")}
            </h4>
            <ul className="space-y-2 text-ink/50">
              <li>
                <Link
                  href="/category/bouquets"
                  className="transition-colors hover:text-brand"
                >
                  {tNav("catalog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/arrangements"
                  className="transition-colors hover:text-brand"
                >
                  {t("collections")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-ink sm:mb-4">
              {t("contact")}
            </h4>
            <ul className="space-y-2 text-ink/50">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-brand"
                >
                  {tNav("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="transition-colors hover:text-brand"
                >
                  {tNav("cart")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-ink sm:mb-4">
              {t("follow")}
            </h4>
            <div className="flex justify-center gap-4 sm:justify-start">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-ink/50 transition-colors hover:text-brand"
              >
                <Instagram size={20} strokeWidth={1.5} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-ink/50 transition-colors hover:text-brand"
              >
                <Facebook size={20} strokeWidth={1.5} />
              </a>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-ink/50 transition-colors hover:text-brand"
              >
                <WhatsAppIcon size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-black/5 pt-6 text-center text-xs text-ink/40 sm:mt-12 sm:pt-8">
          <p>© {new Date().getFullYear()} Alya Bloemen. {t("rights")}.</p>
        </div>
      </div>
    </footer>
  );
}
