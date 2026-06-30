'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { LocalizedProduct } from '@/lib/i18n-content';
import PriceTag from '@/components/PriceTag';
import AddToCartButton from '@/components/AddToCartButton';

export default function ProductDetails({ product }: { product: LocalizedProduct }) {
    const t = useTranslations('Product');
    const { display } = product;
    const hasSizes = display.sizes && display.sizes.length > 0;
    const soldOut = !product.in_stock;

    // Size selection state
    const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
    const selectedVariant = hasSizes ? display.sizes[selectedSizeIdx] : null;

    // Active price: if sizes exist use selected variant price, else base price
    const activePrice = selectedVariant ? selectedVariant.price : product.price;

    // Tab state
    const [activeTab, setActiveTab] = useState<'description' | 'details' | null>(null);

    const { composition, kit_info, important_note, description } = display;
    const hasDescription = !!description;
    const hasDetails = !!(composition || kit_info || important_note);

    return (
        <div className="lg:pt-4">
            {/* Product name */}
            <h1 className="font-display text-2xl font-medium leading-tight text-ink sm:text-3xl lg:text-4xl">
                {display.name}
            </h1>

            {/* Size selector */}
            {hasSizes && (
                <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
                        {t('size')}
                    </p>
                    <div className="flex gap-3">
                        {display.sizes.map((variant, idx) => (
                            <button
                                key={variant.size}
                                onClick={() => setSelectedSizeIdx(idx)}
                                className={`flex-1 py-3 border-2 text-center font-semibold text-sm transition-all
                                    ${selectedSizeIdx === idx
                                        ? 'border-brand bg-brand/5 text-brand'
                                        : 'border-black/10 text-ink/50 hover:border-ink/25'}`}
                            >
                                {variant.size}
                            </button>
                        ))}
                    </div>

                    {/* Size details — what's in the selected size */}
                    {selectedVariant?.details && (
                        <div className="mt-3 bg-cream/60 px-4 py-3">
                            <p className="text-xs font-medium text-ink/40 uppercase tracking-wider mb-1">{t('size_details')}</p>
                            <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">
                                {selectedVariant.details}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Price */}
            <div className="mt-5">
                <PriceTag
                    price={activePrice}
                    discount={product.discount}
                    className="text-2xl"
                />
            </div>

            {/* Add to cart */}
            <div className="mt-6">
                <AddToCartButton
                    productId={product.id}
                    name={display.name}
                    name_uk={product.name_uk}
                    name_nl={product.name_nl}
                    price={activePrice}
                    discount={product.discount}
                    imageUrl={product.image_url}
                    disabled={soldOut}
                    label={t('add_to_cart')}
                    soldOutLabel={t('out_of_stock')}
                    selectedSize={selectedVariant?.size}
                />
            </div>

            {/* Description / Details tabs */}
            {(hasDescription || hasDetails) && (
                <div className="mt-8 border-t border-black/5 pt-6">
                    <div className="flex gap-2">
                        {hasDescription && (
                            <button
                                onClick={() => setActiveTab(activeTab === 'description' ? null : 'description')}
                                className={`flex-1 py-3 border text-sm font-medium transition-all
                                    ${activeTab === 'description'
                                        ? 'border-ink bg-ink text-cream'
                                        : 'border-black/10 text-ink/60 hover:border-ink/25'}`}
                            >
                                {t('description_tab')}
                            </button>
                        )}
                        {hasDetails && (
                            <button
                                onClick={() => setActiveTab(activeTab === 'details' ? null : 'details')}
                                className={`flex-1 py-3 border text-sm font-medium transition-all
                                    ${activeTab === 'details'
                                        ? 'border-ink bg-ink text-cream'
                                        : 'border-black/10 text-ink/60 hover:border-ink/25'}`}
                            >
                                {t('details_tab')}
                            </button>
                        )}
                    </div>

                    {/* Tab content */}
                    {activeTab === 'description' && description && (
                        <div className="mt-4 animate-fade-in">
                            <p className="whitespace-pre-line leading-relaxed text-ink/70 text-sm">
                                {description}
                            </p>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div className="mt-4 space-y-4 animate-fade-in">
                            {composition && (
                                <DetailBlock title={t('composition')} text={composition} />
                            )}
                            {kit_info && (
                                <DetailBlock title={t('kit_info')} text={kit_info} />
                            )}
                            {important_note && (
                                <DetailBlock title={t('important_note')} text={important_note} accent />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DetailBlock({
    title,
    text,
    accent = false,
}: {
    title: string;
    text: string;
    accent?: boolean;
}) {
    return (
        <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-brand-dark">
                {title}
            </h3>
            <p className={`whitespace-pre-line text-sm leading-relaxed ${accent ? 'text-ink' : 'text-ink/70'}`}>
                {text}
            </p>
        </div>
    );
}
