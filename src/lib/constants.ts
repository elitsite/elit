/**
 * Supabase table name constants.
 * Use these instead of raw string literals to prevent typos.
 */
export const DB_TABLES = {
    BOUQUETS: 'bouquets',
    BOUQUETS_PUBLIC: 'bouquets_public',
    SETTINGS: 'settings',
    SETTINGS_PUBLIC: 'settings_public',
    ORDERS: 'orders',
} as const;

// Category hierarchy lives in `./categories` (single source of truth).
export {
    CATEGORY_TREE,
    CATEGORY_LEAF_SLUGS,
    CATEGORY_LEAF_SLUG_SET,
    getLeafCategories,
} from './categories';
export type { CategoryNode } from './categories';
