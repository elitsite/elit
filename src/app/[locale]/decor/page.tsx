import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { CATEGORY_LEAF_SLUGS } from "@/lib/categories";
import { getProductsByCategorySlugs, getSettings } from "@/lib/products";
import { BRAND_NAME, buildLanguageAlternates, canonicalUrl } from "@/lib/site";
import { localizeSettings, type LocalizedSettings } from "@/lib/i18n-content";
import type { Product } from "@/lib/supabase";
import CollectionExplorer from "@/components/CollectionExplorer";
import { useTranslations } from "next-intl";

export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Categories" });
  const label = t("decor");
  const path = `/decor`;
  
  return {
    title: label,
    alternates: {
      canonical: canonicalUrl(locale as Locale, path),
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title: `${label} · ${BRAND_NAME}`,
      url: canonicalUrl(locale as Locale, path),
    },
  };
}

export default async function DecorPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // All decor items end with "-decor"
  const DECOR_SLUGS = CATEGORY_LEAF_SLUGS.filter(s => s.endsWith('-decor'));
  const [products, rawSettings] = await Promise.all([
    getProductsByCategorySlugs(DECOR_SLUGS),
    getSettings(),
  ]);

  const settings = rawSettings ? localizeSettings(rawSettings, locale as Locale) : null;

  return (
    <DecorView
      locale={locale as Locale}
      productNodes={products}
      settings={settings}
    />
  );
}

function DecorView({
  locale,
  productNodes,
  settings,
}: {
  locale: Locale;
  productNodes: Product[];
  settings: LocalizedSettings | null;
}) {
  const tCat = useTranslations("Categories");
  const t = useTranslations("Catalog");
  const title = tCat("decor");

  return (
    <main className="mx-auto max-w-content px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8">
      <header className="mt-4 border-b border-black/5 pb-6 text-center sm:mt-6 sm:pb-8">
        <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/50 sm:mt-3">
          {t("count", { count: productNodes.length })}
        </p>
      </header>

      {productNodes.length === 0 ? (
        <p className="py-24 text-center text-ink/50">{t("empty")}</p>
      ) : (
        <div className="mt-6 sm:mt-10">
          <CollectionExplorer 
            products={productNodes} 
            locale={locale} 
            priceFilters={settings?.price_filters}
          />
        </div>
      )}
    </main>
  );
}
