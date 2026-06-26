import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import {
  CATEGORY_PATHS,
  findCategoryByPath,
  getLeafSlugsUnder,
  type CategoryNode,
} from "@/lib/categories";
import { getProductsByCategorySlugs, getEventPage, getSettings } from "@/lib/products";
import type { Product, EventContent } from "@/lib/supabase";
import { BRAND_NAME, buildLanguageAlternates, canonicalUrl } from "@/lib/site";
import { localizeSettings } from "@/lib/i18n-content";
import CollectionExplorer from "@/components/CollectionExplorer";
import EventLanding from "@/components/EventLanding";
import WeddingLanding from "@/components/WeddingLanding";

export const revalidate = 300;

type Params = { locale: string; slug: string[] };

export function generateStaticParams() {
  const params: Params[] = [];
  for (const locale of routing.locales) {
    for (const path of CATEGORY_PATHS) {
      params.push({ locale, slug: path.split("/") });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const match = findCategoryByPath(slug);
  if (!match) return {};
  const t = await getTranslations({ locale, namespace: "Categories" });
  const label = t(match.node.labelKey);
  const path = `/category/${slug.join("/")}`;
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const match = findCategoryByPath(slug);
  if (!match) notFound();

  // Special-case: weddings and parties render a full landing page.
  const slugPath = slug.join("/");
  const isEventLanding = slugPath === "weddings" || slugPath === "parties";

  if (isEventLanding) {
    const eventSlug = slug[slug.length - 1]; // 'weddings' | 'parties'
    const eventPage = await getEventPage(eventSlug);
    const content = (eventPage?.content ?? {}) as EventContent;
    if (eventSlug === "weddings") {
      return <WeddingLanding content={content} locale={locale as Locale} slug={eventSlug} />;
    }
    return (
      <EventLanding
        content={content}
        locale={locale as Locale}
        slug={eventSlug}
      />
    );
  }

  // Sub-categories of weddings/parties (e.g. weddings/wedding-portfolio)
  // render the event landing page with anchor scroll to the relevant section.
  if (slug.length === 2 && (slug[0] === "weddings" || slug[0] === "parties")) {
    const eventSlug = slug[0]; // 'weddings' | 'parties'
    const subSlug = slug[1]; // 'wedding-portfolio' etc.
    const eventPage = await getEventPage(eventSlug);
    const content = (eventPage?.content ?? {}) as EventContent;
    return (
      <EventLanding
        content={content}
        locale={locale as Locale}
        slug={eventSlug}
        anchor={subSlug}
      />
    );
  }

  const leafSlugs = getLeafSlugsUnder(match.node);
  const [products, rawSettings] = await Promise.all([
    getProductsByCategorySlugs(leafSlugs),
    getSettings(),
  ]);

  const settings = rawSettings ? localizeSettings(rawSettings, locale as Locale) : null;

  return (
    <CategoryView
      locale={locale as Locale}
      trail={match.trail}
      productNodes={products}
      settings={settings}
      node={match.node}
    />
  );
}

function CategoryView({
  locale,
  trail,
  productNodes,
  settings,
  node,
}: {
  locale: Locale;
  trail: CategoryNode[];
  productNodes: Product[];
  settings: any;
  node: CategoryNode;
}) {
  const tCat = useTranslations("Categories");
  const t = useTranslations("Catalog");

  // Build breadcrumbs: removed — no longer displayed.
  const current = trail[trail.length - 1];
  const title = tCat(current.labelKey);

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
            categories={node.children}
          />
        </div>
      )}
    </main>
  );
}
