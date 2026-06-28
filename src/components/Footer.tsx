import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Instagram, Facebook } from "lucide-react";
import WhatsAppIcon from "./icons/WhatsAppIcon";

type Props = {
  contact?: {
    phone?: string | null;
    instagram_link?: string | null;
    facebook_link?: string | null;
    whatsapp_link?: string | null;
    telegram_link?: string | null;
  };
};

/**
 * Clean, structured footer matching the new Alya Bloemen design.
 */
export default function Footer({ contact }: Props) {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const tCat = useTranslations("Categories");

  const phone = contact?.phone || "+31 6 12345678";
  const whatsappUrl = contact?.whatsapp_link || "https://wa.me";
  const instagramUrl = contact?.instagram_link || "https://instagram.com";
  const facebookUrl = contact?.facebook_link || "https://facebook.com";

  return (
    <footer className="border-t border-black/5 bg-cream py-10 sm:py-14">
      <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-16">
          {/* Brand Logo & Statement */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-start">
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/logo.png"
                alt="Alya Bloemen"
                width={120}
                height={60}
                className="h-10 w-auto opacity-90 transition-opacity hover:opacity-100"
              />
            </Link>
            <p className="text-xs text-ink/60 font-display italic max-w-xs leading-relaxed">
              Boutique floral arrangements & custom floral design in Amsterdam.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
              {t("menu")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-ink/60">
              <li><Link href="/" className="transition-colors hover:text-brand">{tNav("home")}</Link></li>
              <li><Link href="/category/bouquets" className="transition-colors hover:text-brand">{tNav("catalog")}</Link></li>
              <li><Link href="/category/weddings" className="transition-colors hover:text-brand">{tCat("weddings")}</Link></li>
              <li><Link href="/category/parties" className="transition-colors hover:text-brand">{tCat("parties")}</Link></li>
              <li><Link href="/#about" className="transition-colors hover:text-brand">{tNav("about")}</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
              {t("customer_service")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-ink/60">
              <li><Link href="/#services" className="transition-colors hover:text-brand">{t("delivery") || "Delivery"}</Link></li>
              <li><Link href="/#services" className="transition-colors hover:text-brand">{t("payment") || "Payment"}</Link></li>
              <li><Link href="/#contacts" className="transition-colors hover:text-brand">{t("contact")}</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
              {t("contacts")}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-ink/60">
              <li><a href="mailto:info@alyabloemen.com" className="transition-colors hover:text-brand">info@alyabloemen.com</a></li>
              <li><a href={`tel:${phone}`} className="transition-colors hover:text-brand">{phone}</a></li>
              <li><p>Amsterdam, Netherlands</p></li>
            </ul>
            
            {/* Social Icons */}
            <div className="mt-5 flex items-center gap-4 text-ink/40">
              <a href={instagramUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href={facebookUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand">
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-brand">
                <WhatsAppIcon size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-black/5 pt-6 text-center text-[11px] text-ink/40 sm:mt-10 sm:text-left">
          <p>© {new Date().getFullYear()} Alya Bloemen. {t("rights")}.</p>
        </div>
      </div>
    </footer>
  );
}
