import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import ProductCard from "./ProductCard";

type Props = {
  /** Display label (from Categories namespace). */
  labelKey: string;
  /** URL path to the category page (e.g. /category/bouquets). */
  href: string;
  products: Product[];
  locale: Locale;
};

/**
 * A category showcase section: title + "View all" link + horizontal scroll
 * grid of product cards. Used on the homepage.
 */
export default function CategorySection({
  labelKey,
  href,
  products,
  locale,
}: Props) {
  const t = useTranslations("Categories");
  const tHome = useTranslations("Home");

  if (products.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-medium text-ink sm:text-3xl">
          {t(labelKey)}
        </h2>
        <Link
          href={href}
          className="text-xs font-medium uppercase tracking-[0.2em] text-ink/50 transition-colors hover:text-brand"
        >
          {tHome("view_all")}
        </Link>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar sm:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[calc(50%-10px)] flex-[0_0_auto] sm:min-w-[calc(33.333%-16px)] lg:min-w-[calc(25%-18px)]"
          >
            <ProductCard product={product} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  );
}
