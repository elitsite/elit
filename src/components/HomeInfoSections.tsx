import { useTranslations } from 'next-intl';
import { Truck, CreditCard, MapPin, Clock, Phone, MessageCircle } from 'lucide-react';
import type { LocalizedSettings } from '@/lib/i18n-content';

export default function HomeInfoSections({ settings }: { settings: LocalizedSettings }) {
    const t = useTranslations('Info');

    const hasDelivery = settings.delivery_price_enabled || settings.display.delivery_info;
    const hasContact = settings.phone || settings.telegram_link || settings.display.address;

    // Extract the iframe src from the admin-provided Google Maps embed code.
    const mapEmbed = settings.google_maps_embed?.trim();
    const mapSrc = mapEmbed
        ? (mapEmbed.match(/src=["']([^"']+)["']/)?.[1] ??
           (mapEmbed.startsWith("http") ? mapEmbed : null))
        : null;

    return (
        <section className="mx-auto max-w-content px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* Delivery */}
                {hasDelivery && (
                    <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                            <Truck size={20} className="text-brand" />
                        </div>
                        <h3 className="font-display text-lg font-medium text-ink mb-3">
                            {t('delivery_title')}
                        </h3>
                        {settings.display.delivery_info && (
                            <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line">
                                {settings.display.delivery_info}
                            </p>
                        )}
                        {settings.delivery_price_enabled && settings.delivery_price && (
                            <p className="mt-3 text-sm font-semibold text-ink">
                                {t('delivery_fee')}: €{settings.delivery_price}
                            </p>
                        )}
                        {settings.display.pickup_info && (
                            <div className="mt-4 pt-4 border-t border-black/5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-1">
                                    {t('pickup')}
                                </p>
                                <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line">
                                    {settings.display.pickup_info}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment */}
                {settings.display.payment_info && (
                    <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                            <CreditCard size={20} className="text-brand" />
                        </div>
                        <h3 className="font-display text-lg font-medium text-ink mb-3">
                            {t('payment_title')}
                        </h3>
                        <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line">
                            {settings.display.payment_info}
                        </p>
                    </div>
                )}

                {/* Schedule */}
                {settings.schedule_enabled && settings.display.schedule && (
                    <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                            <Clock size={20} className="text-brand" />
                        </div>
                        <h3 className="font-display text-lg font-medium text-ink mb-3">
                            {t('schedule_title')}
                        </h3>
                        <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line">
                            {settings.display.schedule}
                        </p>
                    </div>
                )}

                {/* Contact */}
                {hasContact && (
                    <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 md:col-span-2 lg:col-span-1">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                            <MapPin size={20} className="text-brand" />
                        </div>
                        <h3 className="font-display text-lg font-medium text-ink mb-3">
                            {t('contact_title')}
                        </h3>
                        <div className="space-y-3">
                            {settings.display.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="text-ink/30 mt-0.5 flex-shrink-0" />
                                    {settings.address_link ? (
                                        <a href={settings.address_link} target="_blank" rel="noopener noreferrer"
                                           className="text-sm text-ink/60 hover:text-brand transition-colors">
                                            {settings.display.address}
                                        </a>
                                    ) : (
                                        <span className="text-sm text-ink/60">{settings.display.address}</span>
                                    )}
                                </div>
                            )}
                            {settings.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-ink/30 flex-shrink-0" />
                                    <a href={`tel:${settings.phone}`}
                                       className="text-sm text-ink/60 hover:text-brand transition-colors">
                                        {settings.phone}
                                    </a>
                                </div>
                            )}
                            {settings.telegram_link && (
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={16} className="text-ink/30 flex-shrink-0" />
                                    <a href={settings.telegram_link} target="_blank" rel="noopener noreferrer"
                                       className="text-sm text-ink/60 hover:text-brand transition-colors">
                                        Telegram
                                    </a>
                                </div>
                            )}
                            {settings.whatsapp_link && (
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={16} className="text-ink/30 flex-shrink-0" />
                                    <a href={settings.whatsapp_link} target="_blank" rel="noopener noreferrer"
                                       className="text-sm text-ink/60 hover:text-brand transition-colors">
                                        WhatsApp
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Map */}
            {mapSrc && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 sm:mt-6">
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
        </section>
    );
}
