import { useTranslations } from "next-intl";
import type { Product } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import ProductCard from "./ProductCard";

type Props = {
  /** Display label (from Categories namespace). */
  labelKey: string;
  products: Product[];
  locale: Locale;
};

/**
 * A category showcase section: centered title + product grid.
 * Used on the homepage.
 */
export default function CategorySection({
  labelKey,
  products,
  locale,
}: Props) {
  const t = useTranslations("Categories");

  if (products.length === 0) return null;

  return (
    <section className="mb-12 sm:mb-16">
      <h2 className="mb-6 text-center font-display text-2xl font-medium text-ink sm:text-3xl">
        {t(labelKey)}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </section>
  );
}
