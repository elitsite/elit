import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale } from "@/i18n/routing";
import { getProductsByCategorySlugs } from "@/lib/products";
import CategorySection from "@/components/CategorySection";

export default async function Home({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale as Locale;
  const t = await getTranslations("Home");
  const nav = await getTranslations("Nav");

  // Fetch featured products for a few key categories.
  const [
    monoBouquets,
    mixedBouquets,
    boxArrangements,
    basketArrangements,
  ] = await Promise.all([
    getProductsByCategorySlugs(["mono-bouquets"]),
    getProductsByCategorySlugs(["mixed-bouquets"]),
    getProductsByCategorySlugs(["box-arrangements"]),
    getProductsByCategorySlugs(["basket-arrangements"]),
  ]);

  return (
    <main>
      {/* Hero */}
      <section className="relative mx-auto flex min-h-[78vh] max-w-content flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-brand">
          {t("tagline")}
        </span>
        <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl lg:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-ink/70">
          {t("subtitle")}
        </p>
        <Link
          href="/category/bouquets"
          className="mt-10 inline-flex items-center border border-ink/30 px-9 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ink transition-colors hover:border-brand hover:bg-brand hover:text-cream"
        >
          {nav("catalog")}
        </Link>
      </section>

      {/* Category showcases */}
      <section className="mx-auto max-w-content px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="mb-12 font-display text-3xl font-medium text-ink sm:text-4xl">
          {t("shop_by_category")}
        </h2>

        <CategorySection
          labelKey="mono_bouquets"
          href="/category/bouquets/mono-bouquets"
          products={monoBouquets}
          locale={locale}
        />

        <CategorySection
          labelKey="mixed_bouquets"
          href="/category/bouquets/mixed-bouquets"
          products={mixedBouquets}
          locale={locale}
        />

        <CategorySection
          labelKey="box_arrangements"
          href="/category/arrangements/box-arrangements"
          products={boxArrangements}
          locale={locale}
        />

        <CategorySection
          labelKey="basket_arrangements"
          href="/category/arrangements/basket-arrangements"
          products={basketArrangements}
          locale={locale}
        />
      </section>
    </main>
  );
}
