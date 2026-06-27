import { useTranslations } from 'next-intl';
import { Phone, Send, Truck, Store, CreditCard, Clock } from 'lucide-react';
import WhatsAppIcon from './icons/WhatsAppIcon';
import type { LocalizedSettings } from '@/lib/i18n-content';

export default function HomeInfoSections({ settings }: { settings: LocalizedSettings }) {
    const t = useTranslations('Info');

    const showDelivery = settings.show_delivery !== false;
    const showPickup = settings.show_pickup !== false;
    const showPayment = settings.show_payment !== false;
    const showSchedule = settings.schedule_enabled !== false;

    // We only show blocks if they are toggled ON and have some content to display.
    // For delivery, price_enabled might be true even if info is empty.
    const hasDeliveryContent = showDelivery && (settings.delivery_price_enabled || settings.display.delivery_info);
    const hasPickupContent = showPickup && settings.display.pickup_info;
    const hasPaymentContent = showPayment && settings.display.payment_info;
    const hasScheduleContent = showSchedule && settings.display.schedule;
    const hasContactContent = settings.phone || settings.telegram_link || settings.display.address || settings.whatsapp_link;

    // Extract the iframe src from the admin-provided Google Maps embed code.
    const mapEmbed = settings.google_maps_embed?.trim();
    const mapSrc = mapEmbed
        ? (mapEmbed.match(/src=["']([^"']+)["']/)?.[1] ??
           (mapEmbed.startsWith("http") ? mapEmbed : null))
        : null;

    const servicesCount = [hasDeliveryContent, hasPickupContent, hasPaymentContent, hasScheduleContent].filter(Boolean).length;
    const gridColsClass = 
        servicesCount === 4 ? 'lg:grid-cols-4' : 
        servicesCount === 3 ? 'lg:grid-cols-3' : 
        servicesCount === 2 ? 'lg:grid-cols-2' : 
        'lg:grid-cols-1';

    return (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
            <div className="space-y-8 sm:space-y-12">
                
                {/* Block 1: Services (Delivery, Pickup, Payment, Schedule) */}
                {(hasDeliveryContent || hasPickupContent || hasPaymentContent || hasScheduleContent) && (
                    <div className="card-luxury p-8 sm:p-12">
                        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-8 divide-y md:divide-y-0 md:divide-x divide-ink/10`}>
                            {/* Delivery */}
                            {hasDeliveryContent && (
                                <div className="pt-6 md:pt-0 md:px-6 first:pt-0 first:px-0 flex flex-col justify-start">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                                        <Truck className="h-5 w-5" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="font-display text-xl font-medium text-ink mb-3 tracking-wide">
                                        {t('delivery_title')}
                                    </h3>
                                    {settings.delivery_price_enabled && settings.delivery_price && (
                                        <div className="mb-3 inline-self-start text-xs font-semibold uppercase tracking-wider text-brand">
                                            {t('delivery_fee')}: €{settings.delivery_price}
                                        </div>
                                    )}
                                    {settings.display.delivery_info && (
                                        <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">
                                            {settings.display.delivery_info}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Pickup */}
                            {hasPickupContent && (
                                <div className="pt-6 md:pt-0 md:px-6 first:pt-0 first:px-0 flex flex-col justify-start">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                                        <Store className="h-5 w-5" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="font-display text-xl font-medium text-ink mb-3 tracking-wide">
                                        {t('pickup')}
                                    </h3>
                                    <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">
                                        {settings.display.pickup_info}
                                    </p>
                                </div>
                            )}

                            {/* Payment */}
                            {hasPaymentContent && (
                                <div className="pt-6 md:pt-0 md:px-6 first:pt-0 first:px-0 flex flex-col justify-start">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                                        <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="font-display text-xl font-medium text-ink mb-3 tracking-wide">
                                        {t('payment_title')}
                                    </h3>
                                    <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">
                                        {settings.display.payment_info}
                                    </p>
                                </div>
                            )}

                            {/* Schedule */}
                            {hasScheduleContent && (
                                <div className="pt-6 md:pt-0 md:px-6 first:pt-0 first:px-0 flex flex-col justify-start">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                                        <Clock className="h-5 w-5" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="font-display text-xl font-medium text-ink mb-3 tracking-wide">
                                        {t('schedule_title')}
                                    </h3>
                                    <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">
                                        {settings.display.schedule}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Block 2: Contacts & Location */}
                {hasContactContent && (
                    <div className="card-luxury p-8 sm:p-12">
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">
                            <div className="flex flex-col space-y-4 max-w-md">
                                <h3 className="font-display text-2xl sm:text-3xl font-medium text-ink">
                                    {t('contact_title')}
                                </h3>
                                {settings.display.address && (
                                    <div className="text-ink/70 text-base leading-relaxed">
                                        {settings.address_link ? (
                                            <a href={settings.address_link} target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors underline decoration-brand/40 underline-offset-4">
                                                {settings.display.address}
                                            </a>
                                        ) : (
                                            <span>{settings.display.address}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Contact action buttons aligned with brand system */}
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                {settings.phone && (
                                    <a href={`tel:${settings.phone}`} className="btn-secondary gap-2 flex-1 sm:flex-initial">
                                        <Phone size={16} />
                                        <span>{settings.phone}</span>
                                    </a>
                                )}
                                {settings.telegram_link && (
                                    <a href={settings.telegram_link} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2 flex-1 sm:flex-initial">
                                        <Send size={16} />
                                        <span>Telegram</span>
                                    </a>
                                )}
                                {settings.whatsapp_link && (
                                    <a href={settings.whatsapp_link} target="_blank" rel="noopener noreferrer" className="btn-secondary gap-2 flex-1 sm:flex-initial">
                                        <WhatsAppIcon size={16} />
                                        <span>WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Map */}
                        {mapSrc && (
                            <div className="mt-8 overflow-hidden rounded-xl border border-ink/10 w-full">
                                <iframe
                                    src={mapSrc}
                                    title={t('contact_title')}
                                    className="h-[300px] w-full sm:h-[380px]"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
