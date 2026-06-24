'use client';

import { useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCart, finalPrice, type CartItem } from '@/lib/cart';
import { formatEUR } from '@/lib/format';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
    const { items, removeItem, setQuantity, subtotal, clear } = useCart();
    const t = useTranslations('Cart');

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleClear = () => {
        clear();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 bg-black/25 transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-cream shadow-2xl flex flex-col transition-transform duration-200 ease-out will-change-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
                    <h2 className="font-display text-xl text-ink tracking-tight flex items-center gap-2">
                        <ShoppingBag size={18} strokeWidth={1.4} />
                        {t('title')}
                    </h2>
                    <button onClick={onClose} aria-label="Close cart" className="p-1.5 hover:opacity-60 transition-opacity">
                        <X size={20} strokeWidth={1.3} className="text-ink" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="flex items-center justify-center gap-3 mb-5">
                                <span className="w-10 h-px bg-black/10" />
                                <span className="w-1 h-1 rounded-full bg-ink/40" />
                                <span className="w-10 h-px bg-black/10" />
                            </div>
                            <p className="font-display italic text-ink text-lg mb-1">{t('empty_title')}</p>
                            <p className="text-ink/40 text-xs tracking-wide">{t('empty_text')}</p>
                        </div>
                    ) : (
                        items.map((item: CartItem) => {
                            const fp = finalPrice(item.price, item.discount);
                            return (
                                <div
                                    key={item.id}
                                    className="flex gap-3 bg-white rounded-2xl p-3 transition-all duration-200"
                                >
                                    {/* Image */}
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-taupe/10">
                                        <Image
                                            src={item.image_url || '/placeholder.svg'}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-display text-sm text-ink truncate">{item.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm font-semibold text-ink">
                                                {formatEUR(fp)}
                                            </span>
                                            {item.discount > 0 && (
                                                <span className="text-[11px] text-ink/40 line-through">
                                                    {formatEUR(item.price)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => setQuantity(item.id, item.quantity - 1)}
                                                aria-label={t('decrease')}
                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-cream border border-black/10 hover:border-ink transition-colors"
                                            >
                                                <Minus size={12} strokeWidth={1.4} />
                                            </button>
                                            <span className="text-sm font-semibold w-6 text-center text-ink">{item.quantity}</span>
                                            <button
                                                onClick={() => setQuantity(item.id, item.quantity + 1)}
                                                aria-label={t('increase')}
                                                className="w-7 h-7 flex items-center justify-center rounded-full bg-cream border border-black/10 hover:border-ink transition-colors"
                                            >
                                                <Plus size={12} strokeWidth={1.4} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remove + Subtotal */}
                                    <div className="flex flex-col items-end justify-between">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            aria-label={t('remove')}
                                            className="p-1 hover:opacity-70 transition-opacity"
                                        >
                                            <Trash2 size={14} strokeWidth={1.4} className="text-ink/30 hover:text-ink" />
                                        </button>
                                        <span className="text-sm font-semibold text-ink">
                                            {formatEUR(fp * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-black/5 px-6 py-5 space-y-3 bg-cream">
                        <div className="flex justify-between items-baseline">
                            <span className="text-ink/50 text-[10px] uppercase tracking-[0.28em] font-semibold">{t('subtotal')}</span>
                            <span className="font-display text-2xl text-ink tracking-tight">{formatEUR(subtotal)}</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-ink text-cream font-semibold py-3.5 rounded-full text-[10px] uppercase tracking-[0.22em]
                                     hover:bg-brand transition-all duration-300"
                        >
                            {t('checkout')}
                        </button>
                        <button
                            onClick={handleClear}
                            className="w-full text-ink/40 text-[10px] uppercase tracking-[0.22em] py-2 hover:text-ink transition-colors"
                        >
                            {t('clear') || 'Clear cart'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
