/**
 * Server-side data access for the public storefront.
 *
 * Reads from the RLS-safe public views (`bouquets_public`, `settings_public`)
 * via the anon client. These functions are meant to be called from Server
 * Components / route handlers only.
 */
import { supabase, type Product, type Settings, type EventPage } from "@/lib/supabase";
import { DB_TABLES } from "@/lib/constants";

const PRODUCT_LIMIT = 500;

/** Fetch all in-stock products under the given leaf category slugs. */
export async function getProductsByCategorySlugs(
  slugs: string[],
): Promise<Product[]> {
  if (slugs.length === 0) return [];
  const { data, error } = await supabase
    .from(DB_TABLES.BOUQUETS_PUBLIC)
    .select("*")
    .in("category", slugs)
    .order("created_at", { ascending: false })
    .limit(PRODUCT_LIMIT);
  if (error) {
    console.error("getProductsByCategorySlugs error:", error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

/** Fetch a single product by id (uuid). Returns null if not found. */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from(DB_TABLES.BOUQUETS_PUBLIC)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getProductById error:", error.message);
    return null;
  }
  return (data as Product) ?? null;
}

/** Fetch the most recent in-stock products (for homepage showcases). */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from(DB_TABLES.BOUQUETS_PUBLIC)
    .select("*")
    .eq("in_stock", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getFeaturedProducts error:", error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

/** Fetch the public settings row (single record). */
export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await supabase
    .from(DB_TABLES.SETTINGS_PUBLIC)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getSettings error:", error.message);
    return null;
  }
  return (data as Settings) ?? null;
}

/** Distinct in-stock product ids (for generateStaticParams on product pages). */
export async function getAllProductIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from(DB_TABLES.BOUQUETS_PUBLIC)
    .select("id")
    .limit(PRODUCT_LIMIT);
  if (error) {
    console.error("getAllProductIds error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => (r as { id: string }).id);
}

/** Fetch a single event landing page by slug ('weddings' | 'parties'). */
export async function getEventPage(slug: string): Promise<EventPage | null> {
  const { data, error } = await supabase
    .from(DB_TABLES.EVENT_PAGES_PUBLIC)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getEventPage error:", error.message);
    return null;
  }
  return (data as EventPage) ?? null;
}
