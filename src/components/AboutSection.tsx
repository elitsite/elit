import { useTranslations } from "next-intl";
import type { LocalizedSettings } from "@/lib/i18n-content";

/**
 * "About us" section for the homepage. Renders the admin-managed about text
 * (locale-aware) in the Alya Bloemen visual style. Hidden when disabled or empty.
 */
export default function AboutSection({
  settings,
}: {
  settings: LocalizedSettings;
}) {
  const t = useTranslations("Home");

  if (!settings.about_enabled || !settings.display.about_text?.trim()) {
    return null;
  }

  return (
    <section className="border-y border-black/5 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">
          {t("about_eyebrow")}
        </span>
        <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
          {t("about_title")}
        </h2>
        <div className="mx-auto mt-6 h-px w-12 bg-brand/40" />
        <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-ink/70 sm:text-lg">
          {settings.display.about_text}
        </p>
      </div>
    </section>
  );
}
