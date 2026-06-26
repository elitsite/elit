import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import Image from "next/image";
import { getProductsByCategorySlugs, getSettings } from "@/lib/products";
import { localizeSettings } from "@/lib/i18n-content";
import CollectionExplorer from "@/components/CollectionExplorer";
import AboutSection from "@/components/AboutSection";
import HomeInfoSections from "@/components/HomeInfoSections";

/** Leaf category slugs surfaced under "Discover our collections". */
const COLLECTION_SLUGS = [
  "mono-bouquets",
  "mixed-bouquets",
  "box-arrangements",
  "basket-arrangements",
];

export default async function Home({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations("Home");
  const nav = await getTranslations("Nav");

  // Fetch data in parallel
  const [products, rawSettings] = await Promise.all([
    getProductsByCategorySlugs(COLLECTION_SLUGS),
    getSettings(),
  ]);

  const settings = rawSettings ? localizeSettings(rawSettings, locale) : null;

  return (
    <main>
      {/* Hero — compact on mobile */}
      <section className="relative mx-auto flex min-h-[55vh] max-w-content flex-col items-center justify-center px-6 py-16 text-center sm:min-h-[65vh] sm:py-24">
        <span className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand sm:mb-5 sm:text-xs">
          {t("tagline")}
        </span>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-balance text-base text-ink/70 sm:mt-6 sm:text-lg">
          {t("subtitle")}
        </p>
        <Link
          href="/category/bouquets"
          className="mt-8 inline-flex items-center border border-ink/30 px-7 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream sm:mt-10 sm:px-9 sm:py-4 sm:text-xs sm:tracking-[0.25em]"
        >
          {nav("catalog")}
        </Link>

        {/* Hero image — logo3 on mobile, logo2 on desktop */}
        <div className="mt-10 w-full flex justify-center sm:mt-14">
          {/* Mobile image: logo3 */}
          <Image
            src="/logo3.png"
            alt="Alya Bloemen"
            width={420}
            height={420}
            className="block sm:hidden w-[85vw] max-w-[380px] h-auto object-contain"
            priority
          />
          {/* Desktop image: logo2 */}
          <Image
            src="/logo2.png"
            alt="Alya Bloemen"
            width={820}
            height={500}
            className="hidden sm:block w-full max-w-[760px] h-auto object-contain"
            priority
          />
        </div>
      </section>

      {/* About us */}
      {settings && <AboutSection settings={settings} />}

      {/* Collections with filters */}
      <section className="mx-auto max-w-content px-4 pb-12 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8">
        <h2 className="mb-5 text-center font-display text-2xl font-medium text-ink sm:mb-8 sm:text-3xl lg:text-4xl">
          {t("shop_by_category")}
        </h2>

        <CollectionExplorer
          products={products}
          locale={locale}
          priceFilters={rawSettings?.price_filters}
        />
      </section>

      {/* Delivery, Payment & Contact sections */}
      {settings && <HomeInfoSections settings={settings} />}
    </main>
  );
}
