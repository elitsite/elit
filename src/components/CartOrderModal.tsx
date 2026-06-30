'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Truck, Store, Clock, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useCart, finalPrice, type CartItem } from '@/lib/cart';
import { formatEUR } from '@/lib/format';
import { buildTimeSlots, dayKeyFromDate, type WorkingHours } from '@/lib/workingHours';

interface CartOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** When false, delivery is disabled shop-wide; the cart offers pickup only. */
    deliveryEnabled?: boolean;
    /** Per-day working hours used to constrain the delivery-time picker. */
    workingHours?: WorkingHours;
}

/** Build selectable "HH:MM" slots for a given YYYY-MM-DD, filtering past hours for today. */
function getSlotsForDate(dateStr: string, workingHours?: WorkingHours): string[] {
    if (!workingHours || !dateStr) return [];
    const [y, mo, d] = dateStr.split('-').map(Number);
    if (!y || !mo || !d) return [];
    const date = new Date(y, mo - 1, d);
    const day = workingHours[dayKeyFromDate(date)];
    if (!day || !day.open) return [];

    const slots = buildTimeSlots(day.time, 30);
    if (slots.length === 0) return [];

    // For today, drop slots that have already passed.
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        const nowMin = now.getHours() * 60 + now.getMinutes();
        return slots.filter(s => {
            const [h, m] = s.split(':').map(Number);
            return h * 60 + m > nowMin;
        });
    }
    return slots;
}

export default function CartOrderModal({ isOpen, onClose, deliveryEnabled = true, workingHours }: CartOrderModalProps) {
    const t = useTranslations('Cart');
    const locale = useLocale();
    const { items, subtotal, clear } = useCart();

    const [step, setStep] = useState(1);
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | null>(deliveryEnabled ? null : 'pickup');
    const [timeType, setTimeType] = useState<'urgent' | 'specific'>('urgent');
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', comment: '' });
    const [consent, setConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Fallback state
    const [fallbackState, setFallbackState] = useState<{
        show: boolean;
        orderId?: string;
    }>({ show: false });

    // Next 14 calendar days as { value: 'YYYY-MM-DD', label }
    const days = useMemo(() => {
        const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit' });
        const list: { value: string; label: string }[] = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const label = i === 0 ? t('day_today') : i === 1 ? t('day_tomorrow') : fmt.format(date);
            list.push({ value, label });
        }
        return list;
    }, [locale, t]);

    // Only offer days the shop is open and still has free slots.
    const availableDays = useMemo(
        () => days.filter(d => getSlotsForDate(d.value, workingHours).length > 0),
        [days, workingHours],
    );
    const availableTimeSlots = useMemo(
        () => getSlotsForDate(selectedDay, workingHours),
        [selectedDay, workingHours],
    );

    // Keep selectedDay valid (first open day).
    useEffect(() => {
        if (availableDays.length > 0 && !availableDays.find(d => d.value === selectedDay)) {
            setSelectedDay(availableDays[0].value);
        }
    }, [availableDays, selectedDay]);

    // Keep selectedTime valid (first slot of the day).
    useEffect(() => {
        if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(selectedTime)) {
            setSelectedTime(availableTimeSlots[0]);
        }
    }, [availableTimeSlots, selectedTime]);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setError('');
            setPhoneError('');
            setConsent(false);
            setFallbackState({ show: false });
            setDeliveryType(deliveryEnabled ? null : 'pickup');
        }
    }, [isOpen, deliveryEnabled]);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const specificTimeStr = timeType === 'specific'
        ? `${days.find(d => d.value === selectedDay)?.label || selectedDay}, ${selectedTime}`
        : '';

    const handleSubmit = async () => {
        if (isSubmitting) return;

        // Validate phone
        const phoneRegex = /^\+?[\d\s\-]{9,20}$/;
        if (!phoneRegex.test(formData.phone)) {
            setPhoneError(t('err_phone') || 'Enter a valid phone number');
            return;
        }
        setPhoneError('');
        setIsSubmitting(true);
        setError('');

        let timeout: ReturnType<typeof setTimeout> | undefined;

        try {
            const payload = {
                items: items.map(i => ({
                    productId: i.id,
                    quantity: i.quantity,
                })),
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                address: deliveryType === 'delivery' ? formData.address.trim() : undefined,
                deliveryType: deliveryType as 'delivery' | 'pickup',
                timeType,
                specificTime: specificTimeStr || undefined,
                comment: formData.comment.trim() || undefined,
                consent: true,
            };

            const controller = new AbortController();
            timeout = setTimeout(() => controller.abort(), 20000);

            const res = await fetch('/api/cart-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || t('err_generic'));
                return;
            }

            // Redirect to payment
            if (data.redirectUrl) {
                clear();
                window.location.href = data.redirectUrl;
                return;
            }

            // Already paid
            if (data.alreadyPaid) {
                clear();
                window.location.href = `/payment/result?orderId=${data.orderId}&status=success`;
                return;
            }

            // Fallback: order saved but payment init failed
            if (data.fallback) {
                clear();
                setFallbackState({ show: true, orderId: data.orderId });
                return;
            }

            // Success without payment gateway (order saved)
            clear();
            setFallbackState({ show: true, orderId: data.orderId });

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                setError('Request timed out. Please try again.');
            } else {
                setError(t('err_generic'));
            }
        } finally {
            clearTimeout(timeout);
            setIsSubmitting(false);
        }
    };

    // Step validation
    const canProceedStep1 = deliveryType !== null;
    const canProceedStep2 =
        (deliveryType === 'pickup' || (deliveryType === 'delivery' && formData.address.trim().length > 0))
        && (timeType === 'urgent' || availableTimeSlots.length > 0);
    const canProceedStep3 = formData.name.trim().length >= 2 && formData.phone.trim().length >= 10 && consent;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 flex justify-between items-center border-b border-black/5 z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-ink">{t('checkout')}</h2>
                        <p className="text-xs text-ink/40">
                            {fallbackState.show ? '' : `${t(('step' + step) as 'step1' | 'step2' | 'step3') || `Step ${step}`} — ${step}/3`}
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X size={20} className="text-ink/50" />
                    </button>
                </div>

                <div className="p-5">

                    {/* ─── FALLBACK: order saved, no payment ─── */}
                    {fallbackState.show && (
                        <div className="flex flex-col items-center text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mb-4">
                                <AlertTriangle size={32} className="text-brand" />
                            </div>
                            <h3 className="text-xl font-bold text-ink mb-2">{t('success_title')}</h3>
                            <p className="text-ink/50 mb-2">{t('success_text')}</p>
                            {fallbackState.orderId && (
                                <p className="text-xs text-ink/30 mb-6 select-all">
                                    Order: {fallbackState.orderId.slice(0, 8)}
                                </p>
                            )}
                            <button onClick={onClose}
                                className="px-8 py-3 bg-ink text-cream rounded-full font-semibold text-xs uppercase tracking-[0.2em] hover:bg-brand transition-colors">
                                {t('back_home')}
                            </button>
                        </div>
                    )}

                    {/* ─── STEP 1: Cart items + Delivery selection + Totals ─── */}
                    {!fallbackState.show && step === 1 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">
                                {t('title')}
                            </h3>
                            {items.map((item: CartItem) => {
                                const fp = finalPrice(item.price, item.discount);
                                return (
                                    <div key={item.id} className="flex items-center gap-3 bg-cream/50 rounded-xl p-3">
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-taupe/10">
                                            <Image src={item.image_url || '/placeholder.svg'} alt={item.name}
                                                fill className="object-cover" sizes="48px" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-ink truncate">{locale === 'uk' && item.name_uk ? item.name_uk : locale === 'nl' && item.name_nl ? item.name_nl : item.name}</p>
                                            <p className="text-xs text-ink/40">{formatEUR(fp)} × {item.quantity}</p>
                                        </div>
                                        <span className="text-sm font-bold text-ink">{formatEUR(fp * item.quantity)}</span>
                                    </div>
                                );
                            })}

                            {/* Delivery selection */}
                            <div className="pt-3 border-t border-black/5">
                                <h3 className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">{t('delivery_method')}</h3>
                                <div className={`grid gap-3 ${deliveryEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {deliveryEnabled && (
                                        <button onClick={() => setDeliveryType('delivery')}
                                            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${deliveryType === 'delivery' ? 'border-brand bg-brand/5 text-brand' : 'border-black/10 text-ink/40 hover:border-ink/20'}`}>
                                            <Truck size={24} />
                                            <span className="text-sm font-semibold">{t('delivery')}</span>
                                        </button>
                                    )}
                                    <button onClick={() => setDeliveryType('pickup')}
                                        className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${deliveryType === 'pickup' ? 'border-brand bg-brand/5 text-brand' : 'border-black/10 text-ink/40 hover:border-ink/20'}`}>
                                        <Store size={24} />
                                        <span className="text-sm font-semibold">{t('pickup')}</span>
                                    </button>
                                </div>
                                {!deliveryEnabled && (
                                    <p className="text-xs text-ink/40 mt-2">{t('delivery_disabled')}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 pt-3 border-t border-black/5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink/50">{t('subtotal')}:</span>
                                    <span className="text-ink font-medium">{formatEUR(subtotal)}</span>
                                </div>
                                <p className="text-xs text-ink/30">{t('delivery_note')}</p>
                            </div>

                            <button onClick={() => setStep(2)} disabled={!canProceedStep1}
                                className="w-full mt-4 bg-ink text-cream font-semibold py-3.5 rounded-2xl hover:bg-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-[0.15em]">
                                {t('next') || 'Next'}
                            </button>
                        </div>
                    )}

                    {/* ─── STEP 2: Address (if delivery) & Time ─── */}
                    {!fallbackState.show && step === 2 && (
                        <div className="space-y-5">
                            {/* Address (delivery only) */}
                            {deliveryType === 'delivery' && (
                                <div>
                                    <label className="text-sm font-medium text-ink/60 mb-1.5 block">{t('address')}</label>
                                    <input type="text" value={formData.address}
                                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder={t('address_ph') || 'Street, house number, city'}
                                        className="w-full px-4 py-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none text-sm transition-all" />
                                </div>
                            )}

                            {/* Time */}
                            <div>
                                <h3 className="text-sm font-medium text-ink/60 mb-2">{t('time')}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setTimeType('urgent')}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-sm ${timeType === 'urgent' ? 'border-brand bg-brand/5 text-brand' : 'border-black/10 text-ink/40'}`}>
                                        <Clock size={18} />
                                        {t('urgent')}
                                    </button>
                                    <button onClick={() => setTimeType('specific')}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-sm ${timeType === 'specific' ? 'border-brand bg-brand/5 text-brand' : 'border-black/10 text-ink/40'}`}>
                                        <Clock size={18} />
                                        {t('specific')}
                                    </button>
                                </div>
                            </div>

                            {/* Specific date & time pickers (constrained to working hours) */}
                            {timeType === 'specific' && (
                                availableDays.length === 0 ? (
                                    <p className="text-sm text-ink/50 bg-cream/60 rounded-xl p-3">{t('no_slots')}</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium text-ink/60 mb-1.5 block">{t('date')}</label>
                                            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
                                                className="w-full px-3 py-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none text-sm bg-white transition-all">
                                                {availableDays.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-ink/60 mb-1.5 block">{t('time_label')}</label>
                                            <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)}
                                                disabled={availableTimeSlots.length === 0}
                                                className="w-full px-3 py-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none text-sm bg-white disabled:opacity-50 transition-all">
                                                {availableTimeSlots.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )
                            )}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setStep(1)}
                                    className="flex-1 py-3 border-2 border-black/10 text-ink/50 rounded-2xl font-semibold hover:bg-cream transition-colors text-sm">
                                    {t('back') || 'Back'}
                                </button>
                                <button onClick={() => setStep(3)} disabled={!canProceedStep2}
                                    className="flex-1 py-3 bg-ink text-cream rounded-2xl font-semibold hover:bg-brand transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                                    {t('next') || 'Next'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 3: Contact & Confirm & Consent ─── */}
                    {!fallbackState.show && step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-ink/40 uppercase tracking-wider">{t('contact') || 'Contact details'}</h3>

                            <div>
                                <label className="text-sm font-medium text-ink/60 mb-1.5 block">{t('name')}</label>
                                <input type="text" value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none text-sm" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-ink/60 mb-1.5 block">{t('phone')}</label>
                                <input type="tel" inputMode="numeric" value={formData.phone}
                                    onChange={e => { const val = e.target.value.replace(/[^0-9+\-\s]/g, ''); setFormData(prev => ({ ...prev, phone: val })); setPhoneError(''); }}
                                    placeholder="+31 6 1234 5678"
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand/30 outline-none text-sm ${phoneError ? 'border-red-400' : 'border-black/10 focus:border-brand'}`} />
                                {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-ink/60 mb-1.5 block">{t('comment')}</label>
                                <textarea value={formData.comment}
                                    onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none text-sm resize-none" />
                            </div>

                            {/* Order summary */}
                            <div className="bg-cream/50 rounded-xl p-4 space-y-2">
                                {items.map((item: CartItem) => {
                                    const fp = finalPrice(item.price, item.discount);
                                    return (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-ink/60 truncate pr-2">{locale === 'uk' && item.name_uk ? item.name_uk : locale === 'nl' && item.name_nl ? item.name_nl : item.name} × {item.quantity}</span>
                                            <span className="text-ink font-medium whitespace-nowrap">{formatEUR(fp * item.quantity)}</span>
                                        </div>
                                    );
                                })}
                                <div className="flex justify-between pt-2 border-t border-black/10">
                                    <span className="font-semibold text-ink/60">{t('subtotal')}:</span>
                                    <span className="font-bold text-lg text-ink">{formatEUR(subtotal)}</span>
                                </div>
                            </div>

                            {/* Consent checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={e => setConsent(e.target.checked)}
                                    className="mt-0.5 h-5 w-5 rounded border-black/20 text-brand focus:ring-brand/30 cursor-pointer accent-brand"
                                />
                                <span className="text-xs text-ink/50 leading-relaxed">
                                    {t('consent')}
                                </span>
                            </label>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setStep(2)}
                                    className="flex-1 py-3 border-2 border-black/10 text-ink/50 rounded-2xl font-semibold hover:bg-cream transition-colors text-sm">
                                    {t('back') || 'Back'}
                                </button>
                                <button onClick={handleSubmit} disabled={!canProceedStep3 || isSubmitting}
                                    className="flex-1 py-3 bg-ink text-cream rounded-2xl font-semibold hover:bg-brand transition-colors text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {t('place_order')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
