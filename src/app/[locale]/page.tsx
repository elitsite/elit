import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import Image from "next/image";
import { getProductsByCategorySlugs, getSettings } from "@/lib/products";
import { localizeSettings } from "@/lib/i18n-content";
import CollectionExplorer from "@/components/CollectionExplorer";
import AboutSection from "@/components/AboutSection";
import HomeInfoSections from "@/components/HomeInfoSections";
import CategorySection from "@/components/CategorySection";
import EventsSection from "@/components/EventsSection";
import BenefitsSection from "@/components/BenefitsSection";
import {
  MOCK_BOUQUETS,
  MOCK_BASKETS,
  MOCK_DECOR,
  MOCK_FUNERAL,
} from "@/lib/mock-products";

/** Leaf category slugs for the main explorer. */
const EXPLORER_SLUGS = [
  "mono-bouquets",
  "mixed-bouquets",
  "box-arrangements",
  "basket-arrangements",
];

// Slugs for the new showcased categories
const BOUQUET_SLUGS = ["mono-bouquets", "mixed-bouquets", "author-bouquets", "premium-bouquets", "mini-bouquets"];
const BASKET_SLUGS = ["basket-arrangements"];
const DECOR_SLUGS = ["hall-table-decor", "interior-arrangements", "table-arrangements"];
const FUNERAL_SLUGS = ["funeral-arrangement", "funeral-bouquet"];

export default async function Home({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations("Home");
  const nav = await getTranslations("Nav");

  // Fetch all showcased products in parallel for performance
  const [
    explorerProducts,
    rawSettings,
    bouquetProducts,
    basketProducts,
    decorProducts,
    funeralProducts
  ] = await Promise.all([
    getProductsByCategorySlugs(EXPLORER_SLUGS),
    getSettings(),
    getProductsByCategorySlugs(BOUQUET_SLUGS),
    getProductsByCategorySlugs(BASKET_SLUGS),
    getProductsByCategorySlugs(DECOR_SLUGS),
    getProductsByCategorySlugs(FUNERAL_SLUGS),
  ]);

  const settings = rawSettings ? localizeSettings(rawSettings, locale) : null;

  // Fallback to placeholder data when DB has no products yet
  const resolvedBouquets = bouquetProducts.length > 0 ? bouquetProducts : MOCK_BOUQUETS;
  const resolvedBaskets = basketProducts.length > 0 ? basketProducts : MOCK_BASKETS;
  const resolvedDecor = decorProducts.length > 0 ? decorProducts : MOCK_DECOR;
  const resolvedFuneral = funeralProducts.length > 0 ? funeralProducts : MOCK_FUNERAL;

  return (
    <main>
      {/* Hero — full-width background image */}
      <section className="relative flex h-[75vh] w-full flex-col overflow-hidden sm:h-[85vh]">
        <Image
          src="/logo31.png"
          alt="Alya Bloemen"
          fill
          className="block object-cover object-center sm:hidden"
          priority
        />
        <Image
          src="/logo2.png"
          alt="Alya Bloemen"
          fill
          className="hidden object-cover object-center sm:block"
          priority
        />
        <div className="absolute inset-0 bg-black/5" />

        {/* Content Overlay — frosted glass card */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col items-center border border-white/60 bg-white/20 p-8 text-center backdrop-blur-md sm:max-w-3xl sm:rounded-[4rem] sm:p-16 lg:max-w-4xl lg:p-24">
            <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-brand sm:text-xs">
              {t("tagline")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-medium leading-[1.05] text-ink sm:mt-8 sm:text-6xl lg:text-8xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-lg text-sm text-ink/80 sm:mt-8 sm:text-lg lg:text-2xl">
              {t("subtitle")}
            </p>
            <Link
              href="/category/bouquets"
              className="mt-8 inline-flex border border-ink/30 bg-transparent px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink transition-all hover:bg-ink hover:text-white sm:mt-12 sm:px-16 sm:py-5 sm:text-xs"
            >
              {nav("catalog")}
            </Link>
          </div>
        </div>
      </section>

      {/* Discover our collections — search & filter */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-2xl font-medium text-ink sm:text-4xl lg:text-5xl">
            {t("shop_by_category")}
          </h2>
        </div>

        <div className="mt-6 sm:mt-10">
          <CollectionExplorer
            products={explorerProducts}
            locale={locale}
            priceFilters={rawSettings?.price_filters}
          />
        </div>
      </section>

      {/* Bouquets Showcase — 4 cols × 2 rows = 8 items on desktop */}
      <CategorySection
        labelKey="bouquets"
        products={resolvedBouquets.slice(0, 8)}
        locale={locale}
        viewAllHref="/category/bouquets"
        gridCols={4}
      />

      {/* Basket Arrangements Showcase */}
      <CategorySection
        labelKey="basket_arrangements"
        products={resolvedBaskets}
        locale={locale}
        viewAllHref="/category/arrangements/basket-arrangements"
        gridCols={5}
        isScrollable
        autoScroll
        index={0}
      />

      {/* Weddings & Parties Cards */}
      <EventsSection />

      {/* Decor Showcase */}
      <CategorySection
        labelKey="decor"
        products={resolvedDecor}
        locale={locale}
        viewAllHref="/category/arrangements"
        gridCols={5}
        isScrollable
        autoScroll
        index={1}
      />

      {/* Funeral Arrangements Showcase */}
      <CategorySection
        labelKey="funeral"
        products={resolvedFuneral}
        locale={locale}
        viewAllHref="/category/funeral"
        gridCols={5}
        isScrollable
        autoScroll
        index={2}
      />

      {/* About Section */}
      {settings && <AboutSection settings={settings} />}

      {/* Service Benefits Row */}
      <BenefitsSection />

      {/* Detailed Info Sections (Delivery, Payment, Map) */}
      {settings && <HomeInfoSections settings={settings} />}
    </main>
  );
}
