import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // Supported locales. DB content base = English; default DISPLAY locale = Dutch.
    locales: ['en', 'uk', 'nl'],
    defaultLocale: 'nl',
    // Always prefix the locale in the URL (incl. default) — cleanest for SEO:
    // every page has one explicit, canonical, crawlable URL per language.
    localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
