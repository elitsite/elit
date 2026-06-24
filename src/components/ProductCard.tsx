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
  const t = useTranslations("Catalog");
  const p = localizeProduct(product, locale);
  const soldOut = !product.in_stock;
  const hasDiscount = product.discount > 0;

  return (
    <div className="group flex flex-col">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-white">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={p.display.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
              className="object-cover transition-transform duration-700 ease-soft-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink/20">
              <span className="font-display text-4xl">EB</span>
            </div>
          )}

          {hasDiscount && !soldOut && (
            <span className="absolute left-0 top-3 bg-brand px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-cream">
              -{product.discount}%
            </span>
          )}
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-cream/60 backdrop-blur-[1px]">
              <span className="border border-ink/30 bg-cream/80 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink">
                {t("out_of_stock")}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col items-center">
        <Link href={`/product/${product.id}`} className="text-center">
          <h3 className="text-[15px] leading-snug text-ink transition-colors group-hover:text-brand-dark">
            {p.display.name}
          </h3>
        </Link>
        <PriceTag
          price={product.price}
          discount={product.discount}
          className="mt-1.5 justify-center text-[15px]"
        />
        <div className="mt-4 w-full">
          <AddToCartButton
            productId={product.id}
            name={p.display.name}
            price={product.price}
            discount={product.discount}
            imageUrl={product.image_url || ""}
            disabled={soldOut}
            label={t("add_to_cart")}
            soldOutLabel={t("out_of_stock")}
          />
        </div>
      </div>
    </div>
  );
}
