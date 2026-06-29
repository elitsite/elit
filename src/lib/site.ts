/**
 * Central SEO / site configuration for Alina Bloemen.
 *
 * Single source of truth for the canonical site URL, locale → hreflang and
 * locale → Open Graph locale mappings, and business contact data used for
 * Schema.org structured data (JSON-LD). Keep this in sync with messages/*.json.
 */
import { routing, type Locale } from '@/i18n/routing';

/** Absolute, canonical site origin (no trailing slash). Override per env. */
export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://alinabloemen.com'
).replace(/\/$/, '');

export const BRAND_NAME = 'Alina Bloemen';

/** Locales re-exported from routing so SEO code has one import surface. */
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;

/**
 * hreflang values emitted in <link rel="alternate" hreflang="…">.
 * Language-only codes target every region speaking that language, which is the
 * right choice here (one Dutch storefront, not nl-NL vs nl-BE variants).
 */
export const hreflangMap: Record<Locale, string> = {
    en: 'en',
    uk: 'uk',
    nl: 'nl',
};

/** Open Graph locale codes (og:locale / og:locale:alternate). */
export const ogLocaleMap: Record<Locale, string> = {
    en: 'en_US',
    uk: 'uk_UA',
    nl: 'nl_NL',
};

/**
 * Build the `alternates.languages` map for Next.js metadata, including the
 * mandatory `x-default` (points at the default locale's URL). `path` is the
 * locale-independent part of the route, e.g. '' for home or '/category/x'.
 */
export function buildLanguageAlternates(path: string = ''): Record<string, string> {
    const clean = path && !path.startsWith('/') ? `/${path}` : path;
    const languages: Record<string, string> = {};
    for (const locale of locales) {
        languages[hreflangMap[locale]] = `${SITE_URL}/${locale}${clean}`;
    }
    languages['x-default'] = `${SITE_URL}/${defaultLocale}${clean}`;
    return languages;
}

/** Canonical absolute URL for a given locale + path. */
export function canonicalUrl(locale: Locale, path: string = ''): string {
    const clean = path && !path.startsWith('/') ? `/${path}` : path;
    return `${SITE_URL}/${locale}${clean}`;
}

/** Business contact info used for Schema.org LocalBusiness/Florist JSON-LD. */
export const BUSINESS = {
    name: BRAND_NAME,
    legalType: 'Florist',
    // TODO: replace placeholders with real shop data before launch.
    telephone: '',
    email: 'info@alinabloemen.com',
    streetAddress: '',
    addressLocality: '',
    postalCode: '',
    addressCountry: 'NL',
    priceRange: '€€',
    sameAs: [] as string[],
};
