import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL, buildLanguageAlternates } from "@/lib/site";
import { CATEGORY_PATHS } from "@/lib/categories";
import { getAllProductIds } from "@/lib/products";

/**
 * Multilingual sitemap. Every entry lists all locale alternates under
 * `alternates.languages` (plus x-default) so search engines index each
 * language version of every page. Locale-prefixed URLs match `localePrefix:
 * 'always'` in the routing config.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const productIds = await getAllProductIds();

  // Locale-independent paths ('' = home). Legal pages are built in Step 6.
  const contentPaths: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "daily" },
    ...CATEGORY_PATHS.map((p) => ({
      path: `/category/${p}`,
      priority: 0.8,
      freq: "weekly" as const,
    })),
    { path: "/decor", priority: 0.8, freq: "weekly" as const },
    ...productIds.map((id) => ({
      path: `/product/${id}`,
      priority: 0.7,
      freq: "weekly" as const,
    })),
    { path: "/privacy", priority: 0.3, freq: "yearly" as const },
    { path: "/terms", priority: 0.3, freq: "yearly" as const },
    { path: "/refund", priority: 0.3, freq: "yearly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const { path, priority, freq } of contentPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: freq,
        priority,
        alternates: { languages: buildLanguageAlternates(path) },
      });
    }
  }

  return entries;
}
