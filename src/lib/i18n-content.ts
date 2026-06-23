/**
 * Locale-aware content resolution for DB rows.
 *
 * Translatable columns follow the convention: base column is English, with
 * `_nl` and `_uk` suffixed variants. This helper picks the right value for the
 * active locale, falling back to the English base when a translation is empty.
 */
import type { Locale } from "@/i18n/routing";
import type { Product, Settings } from "@/lib/supabase";

/** Pick a translated field with graceful fallback to the English base. */
export function pickField(
  row: Record<string, unknown>,
  base: string,
  locale: Locale,
): string {
  if (locale === "en") return (row[base] as string) ?? "";
  const key = `${base}_${locale}`;
  const translated = row[key] as string | undefined;
  const fallback = row[base] as string | undefined;
  return (translated && translated.trim() ? translated : fallback) ?? "";
}

export interface LocalizedProduct extends Product {
  /** Resolved, locale-correct display fields. */
  display: {
    name: string;
    description: string;
    composition: string;
    kit_info: string;
    important_note: string;
  };
}

/** Attach locale-resolved display fields to a product row. */
export function localizeProduct(
  product: Product,
  locale: Locale,
): LocalizedProduct {
  const row = product as unknown as Record<string, unknown>;
  return {
    ...product,
    display: {
      name: pickField(row, "name", locale),
      description: pickField(row, "description", locale),
      composition: pickField(row, "composition", locale),
      kit_info: pickField(row, "kit_info", locale),
      important_note: pickField(row, "important_note", locale),
    },
  };
}

export interface LocalizedSettings extends Settings {
  display: {
    hero_title: string;
    hero_subtitle: string;
    about_text: string;
    delivery_info: string;
    pickup_info: string;
    payment_info: string;
    schedule: string;
    address: string;
  };
}

/** Attach locale-resolved display fields to the settings row. */
export function localizeSettings(
  settings: Settings,
  locale: Locale,
): LocalizedSettings {
  const row = settings as unknown as Record<string, unknown>;
  return {
    ...settings,
    display: {
      hero_title: pickField(row, "hero_title", locale),
      hero_subtitle: pickField(row, "hero_subtitle", locale),
      about_text: pickField(row, "about_text", locale),
      delivery_info: pickField(row, "delivery_info", locale),
      pickup_info: pickField(row, "pickup_info", locale),
      payment_info: pickField(row, "payment_info", locale),
      schedule: pickField(row, "schedule", locale),
      address: pickField(row, "address", locale),
    },
  };
}

/** Final price after applying a percentage discount (rounded to integer). */
export function finalPrice(price: number, discount: number): number {
  if (!discount || discount <= 0) return price;
  return Math.round(price * (1 - discount / 100));
}
