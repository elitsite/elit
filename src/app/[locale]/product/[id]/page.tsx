import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { type Locale } from "@/i18n/routing";
import { getProductById, getSimilarProducts } from "@/lib/products";
import {
  localizeProduct,
} from "@/lib/i18n-content";
import { BRAND_NAME, buildLanguageAlternates, canonicalUrl } from "@/lib/site";
import ProductGallery from "@/components/ProductGallery";
import ProductDetails from "@/components/ProductDetails";
import SimilarProducts from "@/components/SimilarProducts";

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

  // Fetch similar products from same category
  const similar = await getSimilarProducts(product.category, product.id, 8);
  const localizedSimilar = similar.map((p) => localizeProduct(p, locale as Locale));

  const gallery = [product.image_url, ...(product.extra_images ?? [])];
  const finalPrice = product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : product.price;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: localized.display.name,
    description: localized.display.description || undefined,
    image: gallery.filter(Boolean),
    offers: {
      "@type": "Offer",
      price: finalPrice,
      priceCurrency: "EUR",
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: canonicalUrl(locale as Locale, `/product/${id}`),
    },
  };

  return (
    <main className="mx-auto max-w-content px-4 pb-24 pt-4 sm:px-6 sm:pt-8 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={gallery} alt={localized.display.name} />
        <ProductDetails product={localized} />
      </div>

      {/* Similar Products */}
      {localizedSimilar.length > 0 && (
        <SimilarProducts products={localizedSimilar} locale={locale as Locale} />
      )}
    </main>
  );
}
