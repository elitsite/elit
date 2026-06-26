import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/supabase";
import { localizeProduct } from "@/lib/i18n-content";
import type { Locale } from "@/i18n/routing";
import PriceTag from "./PriceTag";
import AddToCartButton from "./AddToCartButton";

type Props = {
  product: Product;
  locale: Locale;
};

/** Storefront product card: image, name, price, add-to-cart. Links to the product page. */
export default function ProductCard({ product, locale }: Props) {
  const t = useTranslations("Product");
  const tCat = useTranslations("Catalog");
  const p = localizeProduct(product, locale);
  const soldOut = !product.in_stock;
  const hasDiscount = product.discount > 0;

  return (
    <div className="group flex flex-col">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-xl sm:rounded-[2.5rem]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={p.display.name}
              fill
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 33vw, 280px"
              className="object-cover transition-transform duration-700 ease-soft-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink/20">
              <span className="font-display text-3xl sm:text-4xl">EB</span>
            </div>
          )}

          {hasDiscount && !soldOut && (
            <span className="absolute left-0 top-2 bg-brand px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-cream sm:top-3 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.15em]">
              -{product.discount}%
            </span>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-cream/60 backdrop-blur-[1px]">
              <span className="border border-ink/30 bg-cream/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-ink sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]">
                {tCat("out_of_stock")}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col items-center text-center w-full sm:mt-6">
        <Link href={`/product/${product.id}`} className="text-center">
          <h3 className="font-display text-sm font-medium text-ink transition-colors group-hover:text-brand-dark sm:text-lg lg:text-xl">
            {p.display.name}
          </h3>
        </Link>
        <PriceTag
          price={product.price}
          discount={product.discount}
          className="mt-1 justify-center text-sm font-semibold sm:mt-2 sm:text-base lg:text-lg"
        />
        <div className="mt-2 w-full sm:mt-4">
          <AddToCartButton
            productId={product.id}
            name={p.display.name}
            price={product.price}
            discount={product.discount}
            imageUrl={product.image_url || ""}
            disabled={soldOut}
            label={t("add_to_cart")}
            soldOutLabel={tCat("out_of_stock")}
          />
        </div>
      </div>
    </div>
  );
}
