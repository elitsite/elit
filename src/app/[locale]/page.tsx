import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import Image from "next/image";
import { getProductsByCategorySlugs, getSettings, getEventPage } from "@/lib/products";
import { localizeSettings } from "@/lib/i18n-content";
import CollectionExplorer from "@/components/CollectionExplorer";
import AboutSection from "@/components/AboutSection";
import HomeInfoSections from "@/components/HomeInfoSections";
import CategorySection from "@/components/CategorySection";
import EventsSection from "@/components/EventsSection";
import { CATEGORY_LEAF_SLUGS, CATEGORY_TREE, getLeafSlugsUnder } from "@/lib/categories";



// Slugs for the showcased categories
const BOUQUET_SLUGS = getLeafSlugsUnder(CATEGORY_TREE.find((n) => n.slug === "bouquets")!);
const MONO_BOUQUET_SLUGS = ["mono-bouquets"];
const MEN_BOUQUET_SLUGS = ["men-bouquets"];
const PLUK_BOUQUET_SLUGS = ["pluk-bouquets"];
const ARRANGEMENT_SLUGS = getLeafSlugsUnder(CATEGORY_TREE.find((n) => n.slug === "arrangements")!);
const DECOR_RENTAL_SLUGS = ["decor-rental"];
const FUNERAL_SLUGS = getLeafSlugsUnder(CATEGORY_TREE.find((n) => n.slug === "funeral")!);

/** Leaf category slugs for the main explorer. */
const EXPLORER_SLUGS = CATEGORY_LEAF_SLUGS.filter(slug => !FUNERAL_SLUGS.includes(slug));

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
    monoProducts,
    menProducts,
    plukProducts,
    arrangementProducts,
    decorProducts,
    funeralProducts,
    weddingsPage
  ] = await Promise.all([
    getProductsByCategorySlugs(EXPLORER_SLUGS),
    getSettings(),
    getProductsByCategorySlugs(BOUQUET_SLUGS),
    getProductsByCategorySlugs(MONO_BOUQUET_SLUGS),
    getProductsByCategorySlugs(MEN_BOUQUET_SLUGS),
    getProductsByCategorySlugs(PLUK_BOUQUET_SLUGS),
    getProductsByCategorySlugs(ARRANGEMENT_SLUGS),
    getProductsByCategorySlugs(DECOR_RENTAL_SLUGS),
    getProductsByCategorySlugs(FUNERAL_SLUGS),
    getEventPage('weddings'),
  ]);

  const settings = rawSettings ? localizeSettings(rawSettings, locale) : null;

  // Fallback to placeholder data ONLY in development when DB has no products yet.
  // Dynamic import keeps mock-products out of the production bundle entirely.
  const mocks = process.env.NODE_ENV !== 'production'
    ? await import('@/lib/mock-products')
    : null;
  const resolvedBouquets = bouquetProducts.length > 0 ? bouquetProducts : (mocks?.MOCK_BOUQUETS ?? []);
  const resolvedMono = monoProducts.length > 0 ? monoProducts : (mocks?.MOCK_BOUQUETS ?? []);
  const resolvedMen = menProducts.length > 0 ? menProducts : (mocks?.MOCK_BOUQUETS ?? []);
  const resolvedPluk = plukProducts.length > 0 ? plukProducts : (mocks?.MOCK_BOUQUETS ?? []);
  const resolvedArrangements = arrangementProducts.length > 0 ? arrangementProducts : (mocks?.MOCK_BASKETS ?? []);
  const resolvedDecor = decorProducts.length > 0 ? decorProducts : (mocks?.MOCK_DECOR ?? []);
  const resolvedFuneral = funeralProducts.length > 0 ? funeralProducts : (mocks?.MOCK_FUNERAL ?? []);

  return (
    <main>
      {/* Hero — full-width background image */}
      <section className="relative w-full flex flex-col">
        {/* Mobile Image */}
        <Image
          src="/logo3.png"
          alt="Alina Bloemen"
          width={1080}
          height={1080}
          className="block w-full h-auto sm:hidden"
          priority
        />
        {/* Desktop Image */}
        <Image
          src="/logo2.png"
          alt="Alina Bloemen"
          width={1920}
          height={1080}
          className="hidden w-full h-auto sm:block"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />

        {/* Content Overlay for Button */}
        <div className="absolute inset-0 z-10 w-full h-full">
            <Link
              href="/category/bouquets"
              className="absolute left-[7%] top-[66%] sm:left-[12%] sm:top-[70%] btn-primary !rounded-md !px-5 !py-2.5 !text-[10px] sm:!px-6 sm:!py-3.5 sm:!text-xs"
            >
              {nav("catalog")}
            </Link>
        </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center text-ink/60 animate-gentle-bounce sm:bottom-5">
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
      </section>


      <section className="mx-auto max-w-6xl px-4 my-12 sm:px-6 sm:my-20 lg:px-8">
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
            pageSize={8}
            mobilePageSize={4}
          />
        </div>
      </section>

      {/* Bouquets Showcase */}
      <CategorySection
        labelKey="bouquets"
        products={resolvedBouquets}
        locale={locale}
        viewAllHref="/category/bouquets"
        gridCols={5}
        isScrollable
        autoScroll
        index={0}
      />

      {/* Mono Bouquets Showcase */}
      <CategorySection
        labelKey="mono_bouquets"
        products={resolvedMono}
        locale={locale}
        viewAllHref="/category/bouquets/mono-bouquets"
        gridCols={5}
        isScrollable
        autoScroll
        index={1}
      />

      {/* Men's Bouquets Showcase */}
      <CategorySection
        labelKey="men_bouquets"
        products={resolvedMen}
        locale={locale}
        viewAllHref="/category/bouquets/men-bouquets"
        gridCols={5}
        isScrollable
        autoScroll
        index={2}
      />

      {/* Natural Style Bouquets Showcase */}
      <CategorySection
        labelKey="pluk_bouquets"
        products={resolvedPluk}
        locale={locale}
        viewAllHref="/category/bouquets/pluk-bouquets"
        gridCols={5}
        isScrollable
        autoScroll
        index={3}
      />

      {/* Arrangements Showcase */}
      <CategorySection
        labelKey="arrangements"
        products={resolvedArrangements}
        locale={locale}
        viewAllHref="/category/arrangements"
        gridCols={5}
        isScrollable
        autoScroll
        index={4}
      />

      {/* Weddings & Parties Cards */}
      <EventsSection images={weddingsPage?.content?.slider_images} />

      {/* Decor Rental Showcase */}
      <CategorySection
        labelKey="decor_rental"
        products={resolvedDecor}
        locale={locale}
        viewAllHref="/category/decor-rental"
        gridCols={5}
        isScrollable
        autoScroll
        index={5}
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
        index={6}
      />

      {/* About Section */}
      {settings && <AboutSection settings={settings} />}



      {/* Detailed Info Sections (Delivery, Payment, Map) */}
      {settings && <HomeInfoSections settings={settings} />}
    </main>
  );
}
