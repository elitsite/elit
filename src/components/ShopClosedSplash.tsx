import { useTranslations } from "next-intl";
import { Phone } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Full-screen "shop temporarily closed" splash shown to visitors when the
 * admin flips `shop_open` off. Admin routes live outside `[locale]`, so they
 * remain accessible while this is displayed.
 */
export default function ShopClosedSplash({ phone }: { phone?: string }) {
  const t = useTranslations("Closed");

  return (
    <div className="relative flex min-h-screen w-full max-w-[100vw] flex-col items-center justify-center overflow-hidden bg-cream px-6 text-center">
      <div className="absolute right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <div className="mb-6 flex items-center gap-3 text-ink/40">
          <span className="h-px w-10 bg-ink/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          <span className="h-px w-10 bg-ink/20" />
        </div>

        <h1 className="font-display text-3xl font-medium uppercase tracking-[0.12em] text-ink sm:text-4xl">
          {t("title")}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-ink/60">
          {t("desc")}
        </p>

        <p className="mt-3 text-sm text-ink/40">{t("sub")}</p>

        {phone && (
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className="mt-8 inline-flex items-center gap-2 border border-ink/30 px-6 py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream"
          >
            <Phone size={16} strokeWidth={1.5} />
            {phone}
          </a>
        )}
      </div>
    </div>
  );
}
