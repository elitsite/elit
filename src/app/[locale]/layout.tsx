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
import { safeJsonLd } from "@/lib/safeJsonLd";
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

  const ogImage = {
    url: `${SITE_URL}/lol.png`,
    width: 1200,
    height: 630,
    alt: BRAND_NAME,
  };

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s · ${BRAND_NAME}`,
    },
    description,
    keywords: t("keywords"),
    applicationName: BRAND_NAME,
    icons: {
      icon: "/lol.png",
      shortcut: "/lol.png",
      apple: "/lol.png",
    },
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
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
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

  // Prefer real, admin-managed contact data from settings; fall back to the
  // static BUSINESS config when a field is not configured yet.
  const telephone = settings?.phone?.trim() || BUSINESS.telephone;
  const streetAddress = settings?.address?.trim() || BUSINESS.streetAddress;
  const sameAs = [
    settings?.instagram_link,
    settings?.facebook_link,
    settings?.whatsapp_link,
    settings?.telegram_link,
    ...BUSINESS.sameAs,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Florist", "LocalBusiness"],
    name: BRAND_NAME,
    url: canonicalUrl(locale),
    image: `${SITE_URL}/lol.png`,
    priceRange: BUSINESS.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: streetAddress || undefined,
      addressLocality: BUSINESS.addressLocality || undefined,
      postalCode: BUSINESS.postalCode || undefined,
      addressCountry: BUSINESS.addressCountry,
    },
    areaServed: { "@type": "Country", name: "Netherlands" },
    ...(telephone ? { telephone } : {}),
    ...(BUSINESS.email ? { email: BUSINESS.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${jost.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
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
