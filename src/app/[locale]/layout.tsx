import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import {
  SITE_URL,
  BRAND_NAME,
  BUSINESS,
  ogLocaleMap,
  buildLanguageAlternates,
  canonicalUrl,
} from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/lib/cart";
import { getSettings } from "@/lib/products";
import { extractWorkingHours } from "@/lib/workingHours";
import ShopClosedSplash from "@/components/ShopClosedSplash";
import "../globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const jost = Jost({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${BRAND_NAME}`,
    },
    description,
    keywords: t("keywords"),
    applicationName: BRAND_NAME,
    alternates: {
      canonical: canonicalUrl(locale as Locale),
      languages: buildLanguageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: BRAND_NAME,
      title,
      description,
      url: canonicalUrl(locale as Locale),
      locale: ogLocaleMap[locale as Locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => ogLocaleMap[l]),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const settings = await getSettings();
  const headerContact = settings
    ? {
        phone: settings.phone,
        instagram_link: settings.instagram_link,
        facebook_link: settings.facebook_link,
        whatsapp_link: settings.whatsapp_link,
        telegram_link: settings.telegram_link,
      }
    : undefined;

  const deliveryEnabled = settings?.delivery_enabled !== false;
  const workingHours = settings ? extractWorkingHours(settings) : undefined;
  // Fail-open: only treat the shop as closed when the flag is explicitly false.
  const shopClosed = settings?.shop_open === false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Florist", "LocalBusiness"],
    name: BRAND_NAME,
    url: canonicalUrl(locale),
    image: `${SITE_URL}/og-image.jpg`,
    priceRange: BUSINESS.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress || undefined,
      addressLocality: BUSINESS.addressLocality || undefined,
      postalCode: BUSINESS.postalCode || undefined,
      addressCountry: BUSINESS.addressCountry,
    },
    areaServed: { "@type": "Country", name: "Netherlands" },
    ...(BUSINESS.telephone ? { telephone: BUSINESS.telephone } : {}),
    ...(BUSINESS.email ? { email: BUSINESS.email } : {}),
    ...(BUSINESS.sameAs.length ? { sameAs: BUSINESS.sameAs } : {}),
  };

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${jost.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider>
          {shopClosed ? (
            <ShopClosedSplash phone={settings?.phone} />
          ) : (
            <CartProvider>
              <Header
                contact={headerContact}
                deliveryEnabled={deliveryEnabled}
                workingHours={workingHours}
              />
              {children}
              <Footer contact={headerContact} />
              <WhatsAppButton />
            </CartProvider>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
