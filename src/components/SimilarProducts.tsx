'use client';

import { useTranslations } from 'next-intl';
import type { LocalizedProduct } from '@/lib/i18n-content';
import type { Locale } from '@/i18n/routing';
import ProductCard from './ProductCard';

export default function SimilarProducts({
    products,
    locale,
}: {
    products: LocalizedProduct[];
    locale: Locale;
}) {
    const t = useTranslations('Product');

    if (products.length === 0) return null;

    return (
        <section className="mt-16 border-t border-black/5 pt-12">
            <h2 className="mb-8 font-display text-2xl font-medium text-ink sm:text-3xl">
                {t('similar')}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {products.slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} locale={locale} />
                ))}
            </div>
        </section>
    );
}
