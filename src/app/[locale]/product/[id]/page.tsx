import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { type Locale } from "@/i18n/routing";
import { findTrailByLeafSlug } from "@/lib/categories";
import { getProductById } from "@/lib/products";
import {
  localizeProduct,
  type LocalizedProduct,
} from "@/lib/i18n-content";
import { BRAND_NAME, buildLanguageAlternates, canonicalUrl } from "@/lib/site";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import PriceTag from "@/components/PriceTag";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 300;

type Params = { locale: string; id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProductById(id);
  if (!product) return {};
  const p = localizeProduct(product, locale as Locale);
  const path = `/product/${id}`;
  return {
    title: p.display.name,
    description: p.display.description?.slice(0, 160) || undefined,
    alternates: {
      canonical: canonicalUrl(locale as Locale, path),
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title: `${p.display.name} · ${BRAND_NAME}`,
      url: canonicalUrl(locale as Locale, path),
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const product = await getProductById(id);
  if (!product) notFound();

  const localized = localizeProduct(product, locale as Locale);
  return <ProductView product={localized} />;
}

function ProductView({
  product,
}: {
  product: LocalizedProduct;
}) {
  const t = useTranslations("Product");
  const tCat = useTranslations("Categories");
  const tCatalog = useTranslations("Catalog");

  const trail = findTrailByLeafSlug(product.category) ?? [];
  const crumbs: Crumb[] = [{ label: tCatalog("home"), href: "/" }];
  trail.forEach((node, i) => {
    const href = `/category/${trail
      .slice(0, i + 1)
      .map((n) => n.slug)
      .join("/")}`;
    crumbs.push({ label: tCat(node.labelKey), href });
  });
  crumbs.push({ label: product.display.name });

  const gallery = [product.image_url, ...(product.extra_images ?? [])];
  const soldOut = !product.in_stock;
  const { composition, kit_info, important_note, description } = product.display;

  return (
    <main className="mx-auto max-w-content px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={crumbs} />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={gallery} alt={product.display.name} />

        <div className="lg:pt-4">
          <h1 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            {product.display.name}
          </h1>

          <div className="mt-5">
            <PriceTag
              price={product.price}
              discount={product.discount}
              className="text-2xl"
            />
          </div>

          {description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-ink/70">
              {description}
            </p>
          )}

          <div className="mt-8 max-w-md">
            <AddToCartButton
              productId={product.id}
              name={product.display.name}
              price={product.price}
              discount={product.discount}
              imageUrl={product.image_url}
              disabled={soldOut}
              label={t("add_to_cart")}
              soldOutLabel={t("out_of_stock")}
            />
          </div>

          <div className="mt-10 space-y-6 border-t border-black/5 pt-8">
            {composition && (
              <Detail title={t("composition")}>{composition}</Detail>
            )}
            {kit_info && <Detail title={t("kit_info")}>{kit_info}</Detail>}
            {important_note && (
              <Detail title={t("important_note")} accent>
                {important_note}
              </Detail>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Detail({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-dark">
        {title}
      </h2>
      <p
        className={`whitespace-pre-line leading-relaxed ${
          accent ? "text-ink" : "text-ink/70"
        }`}
      >
        {children}
      </p>
    </section>
  );
}
