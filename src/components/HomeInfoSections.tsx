import { useTranslations } from 'next-intl';
import { Truck, Store, CreditCard, MapPin, Clock, Phone, Send } from 'lucide-react';
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

    return (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                
                {/* Delivery */}
                {hasDeliveryContent && (
                    <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-400 relative overflow-hidden border border-black/5 text-center flex flex-col h-full flex-1 basis-[280px] max-w-sm">
                        <div className="flex items-center justify-center w-14 h-14 bg-brand/10 rounded-2xl mb-5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-400 mx-auto flex-shrink-0">
                            <Truck size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="font-display text-lg font-bold text-ink mb-3 tracking-wide">
                            {t('delivery_title')}
                        </h3>
                        {settings.delivery_price_enabled && settings.delivery_price && (
                            <div className="mb-2 inline-block px-3 py-1 bg-brand/5 text-brand rounded-full text-sm font-semibold">
                                {t('delivery_fee')}: €{settings.delivery_price}
                            </div>
                        )}
                        {settings.display.delivery_info && (
                            <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line mt-auto">
                                {settings.display.delivery_info}
                            </p>
                        )}
                        <div className="absolute bottom-0 left-0 h-[3px] bg-brand w-0 group-hover:w-full transition-all duration-500 ease-out" />
                    </div>
                )}

                {/* Pickup */}
                {hasPickupContent && (
                    <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-400 relative overflow-hidden border border-black/5 text-center flex flex-col h-full flex-1 basis-[280px] max-w-sm">
                        <div className="flex items-center justify-center w-14 h-14 bg-brand/10 rounded-2xl mb-5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-400 mx-auto flex-shrink-0">
                            <Store size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="font-display text-lg font-bold text-ink mb-3 tracking-wide">
                            {t('pickup')}
                        </h3>
                        <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line mt-auto">
                            {settings.display.pickup_info}
                        </p>
                        <div className="absolute bottom-0 left-0 h-[3px] bg-brand w-0 group-hover:w-full transition-all duration-500 ease-out" />
                    </div>
                )}

                {/* Payment */}
                {hasPaymentContent && (
                    <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-400 relative overflow-hidden border border-black/5 text-center flex flex-col h-full flex-1 basis-[280px] max-w-sm">
                        <div className="flex items-center justify-center w-14 h-14 bg-brand/10 rounded-2xl mb-5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-400 mx-auto flex-shrink-0">
                            <CreditCard size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="font-display text-lg font-bold text-ink mb-3 tracking-wide">
                            {t('payment_title')}
                        </h3>
                        <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line mt-auto">
                            {settings.display.payment_info}
                        </p>
                        <div className="absolute bottom-0 left-0 h-[3px] bg-brand w-0 group-hover:w-full transition-all duration-500 ease-out" />
                    </div>
                )}

                {/* Schedule */}
                {hasScheduleContent && (
                    <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-400 relative overflow-hidden border border-black/5 text-center flex flex-col h-full flex-1 basis-[280px] max-w-sm">
                        <div className="flex items-center justify-center w-14 h-14 bg-brand/10 rounded-2xl mb-5 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-400 mx-auto flex-shrink-0">
                            <Clock size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="font-display text-lg font-bold text-ink mb-3 tracking-wide">
                            {t('schedule_title')}
                        </h3>
                        <p className="text-sm text-ink/60 leading-relaxed whitespace-pre-line mt-auto">
                            {settings.display.schedule}
                        </p>
                        <div className="absolute bottom-0 left-0 h-[3px] bg-brand w-0 group-hover:w-full transition-all duration-500 ease-out" />
                    </div>
                )}

                {/* Contact */}
                {hasContactContent && (
                    <div className="group bg-white rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-400 relative overflow-hidden border border-black/5 w-full mt-2 sm:mt-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 w-full">
                            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-shrink-0">
                                <div className="flex items-center justify-center w-14 h-14 bg-brand/10 rounded-2xl mb-4 text-brand group-hover:bg-brand group-hover:text-white transition-all duration-400">
                                    <MapPin size={28} strokeWidth={1.5} />
                                </div>
                                <h3 className="font-display text-2xl font-bold text-ink mb-2">
                                    {t('contact_title')}
                                </h3>
                                {settings.display.address && (
                                    <div className="text-ink/60 max-w-xs text-sm">
                                        {settings.address_link ? (
                                            <a href={settings.address_link} target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors underline decoration-brand/30 underline-offset-4">
                                                {settings.display.address}
                                            </a>
                                        ) : (
                                            <span>{settings.display.address}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                                {settings.phone && (
                                    <a href={`tel:${settings.phone}`} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/5 hover:bg-brand/5 hover:text-brand transition-colors gap-2 text-ink/70">
                                        <Phone size={20} />
                                        <span className="text-sm font-medium">{settings.phone}</span>
                                    </a>
                                )}
                                {settings.telegram_link && (
                                    <a href={settings.telegram_link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] transition-colors gap-2">
                                        <Send size={20} />
                                        <span className="text-sm font-medium">Telegram</span>
                                    </a>
                                )}
                                {settings.whatsapp_link && (
                                    <a href={settings.whatsapp_link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors gap-2">
                                        <WhatsAppIcon size={20} />
                                        <span className="text-sm font-medium">WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Map */}
                        {mapSrc && (
                            <div className="mt-8 overflow-hidden rounded-2xl border border-black/5 w-full">
                                <iframe
                                    src={mapSrc}
                                    title={t('contact_title')}
                                    className="h-[300px] w-full sm:h-[400px]"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    allowFullScreen
                                />
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 h-[3px] bg-brand w-0 group-hover:w-full transition-all duration-500 ease-out" />
                    </div>
                )}
            </div>
        </section>
    );
}
