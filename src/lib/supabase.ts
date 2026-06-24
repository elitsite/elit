import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface SizeVariant {
    size: 'S' | 'M' | 'L';
    price: number;
    details: string; // e.g. "5 roses, eucalyptus"
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discount: number;
    image_url: string;
    in_stock: boolean;
    category: string;
    created_at: string;
    // Extra images (up to 4 additional)
    extra_images?: string[];
    // Structured description fields
    composition?: string;
    composition_uk?: string;
    composition_nl?: string;
    kit_info?: string;
    kit_info_uk?: string;
    kit_info_nl?: string;
    important_note?: string;
    important_note_uk?: string;
    important_note_nl?: string;
    // Translations (base = EN)
    name_uk?: string;
    name_nl?: string;
    description_uk?: string;
    description_nl?: string;
    // Size variants (optional, JSON arrays)
    sizes?: SizeVariant[];       // EN details
    sizes_uk?: SizeVariant[];    // UK details
    sizes_nl?: SizeVariant[];    // NL details
}

export interface Settings {
    id: string;
    shop_open: boolean;
    delivery_enabled: boolean;
    // Branding (shop_name NOT translated)
    shop_name: string;
    hero_title: string;
    hero_subtitle: string;
    // Contacts
    phone: string;
    telegram_link: string;
    address: string;
    address_link: string;
    schedule: string;
    // Per-day schedule
    sched_mon_open?: boolean;
    sched_tue_open?: boolean;
    sched_wed_open?: boolean;
    sched_thu_open?: boolean;
    sched_fri_open?: boolean;
    sched_sat_open?: boolean;
    sched_sun_open?: boolean;
    sched_mon?: string;
    sched_tue?: string;
    sched_wed?: string;
    sched_thu?: string;
    sched_fri?: string;
    sched_sat?: string;
    sched_sun?: string;
    // Social links
    instagram_link?: string;
    facebook_link?: string;
    whatsapp_link?: string;
    google_maps_embed?: string;
    // Content fields with toggles
    about_enabled: boolean;
    about_text: string;
    schedule_enabled: boolean;
    delivery_price_enabled: boolean;
    delivery_price: string;
    delivery_info: string;
    pickup_info: string;
    payment_info: string;
    // Translations (base = EN)
    hero_title_uk?: string; hero_title_nl?: string;
    hero_subtitle_uk?: string; hero_subtitle_nl?: string;
    about_text_uk?: string; about_text_nl?: string;
    delivery_info_uk?: string; delivery_info_nl?: string;
    pickup_info_uk?: string; pickup_info_nl?: string;
    payment_info_uk?: string; payment_info_nl?: string;
    schedule_uk?: string; schedule_nl?: string;
    address_uk?: string; address_nl?: string;
    // Dynamic price filters
    price_filters?: PriceFilter[];
}

// ── Price filter types & normalization ──
export interface PriceFilter {
    min: number;
    max: number | null; // null = no upper bound
}

export const DEFAULT_PRICE_FILTERS: PriceFilter[] = [
    { min: 0, max: 100 }, { min: 0, max: 200 }, { min: 0, max: 300 },
    { min: 0, max: 500 }, { min: 0, max: 1000 }, { min: 1000, max: null },
];

/** Normalize price_filters: drop invalid, dedupe, fallback to default */
export function normalizePriceFilters(raw: unknown): PriceFilter[] {
    if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_PRICE_FILTERS.map(f => ({ ...f }));

    const seen = new Set<string>();
    const valid: PriceFilter[] = [];

    for (const item of raw) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;

        const rec = item as Record<string, unknown>;
        const min = rec.min;
        const max = rec.max;

        if (typeof min !== 'number' || !Number.isFinite(min) || !Number.isInteger(min) || min < 0) continue;
        if (max !== null && (typeof max !== 'number' || !Number.isFinite(max) || !Number.isInteger(max) || max <= min)) continue;

        const key = `${min}-${max ?? 'inf'}`;
        if (seen.has(key)) continue;
        seen.add(key);
        valid.push({ min, max: max as number | null });
    }

    return valid.length > 0 ? valid : DEFAULT_PRICE_FILTERS.map(f => ({ ...f }));
}

// ── Typed helpers for dynamic schedule field access ──
export type ScheduleDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type SchedOpenKey = `sched_${ScheduleDay}_open`;
type SchedTimeKey = `sched_${ScheduleDay}`;

export function getScheduleOpen(settings: Settings, day: ScheduleDay): boolean {
    const key = `sched_${day}_open` as SchedOpenKey;
    return settings[key] !== false;
}

export function getScheduleTime(settings: Settings, day: ScheduleDay): string {
    const key = `sched_${day}` as SchedTimeKey;
    return settings[key] || '';
}

export function setScheduleField(settings: Settings, day: ScheduleDay, field: 'open' | 'time', value: boolean | string): Settings {
    if (field === 'open') {
        const key = `sched_${day}_open` as SchedOpenKey;
        return { ...settings, [key]: value };
    }
    const key = `sched_${day}` as SchedTimeKey;
    return { ...settings, [key]: value };
}

export interface Order {
    id: string;
    status: 'new' | 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
    product_id?: string;
    product_name: string;
    product_price: number;
    customer_name: string;
    customer_phone: string;
    delivery_type: 'delivery' | 'pickup';
    address?: string;
    time_type?: 'urgent' | 'specific';
    specific_time?: string;
    comment?: string;
    order_type?: 'bouquet' | 'cart';
    items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        finalPrice: number;
    }>;
    // Payment fields (provider TBD — see cart-order route)
    payment_id?: string | null;
    payment_status?: 'pending' | 'paid' | 'failed' | 'expired' | 'bank_unavailable' | 'sync_error' | null;
    paid_at?: string | null;
    payment_error?: string | null;
    consent_at?: string | null;
    delivery_fee?: number;
    items_subtotal?: number | null;
    payment_method_used?: string | null;
    payment_started_at?: string | null;
    payment_redirect_url?: string | null;
}

// ── Event Pages (weddings / parties landing) ──

export interface LocalizedText {
    en?: string;
    uk?: string;
    nl?: string;
}

export interface EventSection {
    image: string;
    title: LocalizedText;
    text: LocalizedText;
}

export interface PortfolioItem {
    image: string;
    caption: LocalizedText;
}

export interface EventContent {
    hero_image: string;
    hero_title: LocalizedText;
    hero_subtitle: LocalizedText;
    intro_kicker: LocalizedText;
    intro_title: LocalizedText;
    intro_text: LocalizedText;
    intro_button: LocalizedText;
    media_image: string;
    sections: EventSection[];
    quote_image: string;
    quote_kicker: LocalizedText;
    quote_text: LocalizedText;
    quote_author: LocalizedText;
    portfolio_kicker: LocalizedText;
    portfolio_title: LocalizedText;
    portfolio: PortfolioItem[];
    packages_kicker: LocalizedText;
    packages_title: LocalizedText;
    packages: PortfolioItem[];
    decor_kicker: LocalizedText;
    decor_title: LocalizedText;
    decor: PortfolioItem[];
    gallery: string[];
    form_title: LocalizedText;
}

export interface EventPage {
    slug: string;
    content: EventContent;
    updated_at: string;
}
