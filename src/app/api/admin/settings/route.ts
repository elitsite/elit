import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { NO_CACHE_HEADERS, assertSameOrigin } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';

// Whitelist of fields allowed to be updated via PUT
const ALLOWED_SETTINGS_FIELDS = new Set([
    'shop_open', 'delivery_enabled',
    'shop_name', 'hero_title', 'hero_subtitle',
    'phone', 'telegram_link', 'address', 'address_link', 'schedule',
    // Per-day schedule
    'sched_mon', 'sched_mon_open', 'sched_tue', 'sched_tue_open',
    'sched_wed', 'sched_wed_open', 'sched_thu', 'sched_thu_open',
    'sched_fri', 'sched_fri_open', 'sched_sat', 'sched_sat_open',
    'sched_sun', 'sched_sun_open',
    // Social
    'instagram_link', 'facebook_link', 'whatsapp_link', 'google_maps_embed',
    // Content
    'about_enabled', 'about_text', 'schedule_enabled',
    'delivery_price_enabled', 'delivery_price',
    'delivery_info', 'pickup_info', 'payment_info',
    // Translations
    'hero_title_uk', 'hero_title_nl',
    'hero_subtitle_uk', 'hero_subtitle_nl',
    'about_text_uk', 'about_text_nl',
    'delivery_info_uk', 'delivery_info_nl',
    'pickup_info_uk', 'pickup_info_nl',
    'payment_info_uk', 'payment_info_nl',
    'schedule_uk', 'schedule_nl',
    'address_uk', 'address_nl',
    // Dynamic price filters
    'price_filters',
]);

function sanitizeSettings(raw: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (ALLOWED_SETTINGS_FIELDS.has(key)) {
            clean[key] = value;
        }
    }
    return clean;
}

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

const URL_FIELDS = ['telegram_link', 'address_link', 'instagram_link', 'facebook_link', 'whatsapp_link'] as const;

function isValidHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

function validateSettingsPayload(settings: Record<string, unknown>): string | null {
    for (const key of URL_FIELDS) {
        const value = settings[key];
        if (value === undefined || value === null || value === '') continue;
        if (typeof value !== 'string' || value.length > 2048 || !isValidHttpUrl(value)) {
            return `Invalid URL in field: ${key}`;
        }
    }

    const phone = settings.phone;
    if (phone !== undefined && phone !== null && phone !== '') {
        if (typeof phone !== 'string' || phone.length > 32 || !/^[+\d\s()\-]+$/.test(phone)) {
            return 'Invalid phone format';
        }
    }

    const embed = settings.google_maps_embed;
    if (embed !== undefined && embed !== null && embed !== '') {
        if (typeof embed !== 'string' || embed.length > 10000) {
            return 'Invalid Google Maps embed value';
        }
        // Validate that embed contains only a trusted Google Maps URL
        const embedUrlMatch = embed.match(/src=["']([^"']+)["']/);
        const embedUrl = embedUrlMatch ? embedUrlMatch[1] : embed;
        if (!/^https:\/\/(www\.)?google\.com\/maps\/embed/.test(embedUrl) &&
            !/^https:\/\/maps\.google\.com\//.test(embedUrl)) {
            return 'Google Maps embed must contain a valid Google Maps URL';
        }
    }

    // Price filters validation
    const pf = settings.price_filters;
    if (pf !== undefined) {
        if (!Array.isArray(pf) || pf.length > 10) return 'Invalid price_filters';
        const seen = new Set<string>();
        for (const f of pf) {
            if (typeof f !== 'object' || f === null || Array.isArray(f)) {
                return 'Invalid price filter entry';
            }
            const rec = f as Record<string, unknown>;
            const min = rec.min;
            const max = rec.max;
            if (typeof min !== 'number' || !Number.isFinite(min) || !Number.isInteger(min) || min < 0) {
                return 'Invalid filter min';
            }
            if (max !== null && (typeof max !== 'number' || !Number.isFinite(max) || !Number.isInteger(max) || max <= min)) {
                return 'Invalid filter max';
            }
            const key = `${min}-${max ?? 'inf'}`;
            if (seen.has(key)) return 'Duplicate price filter';
            seen.add(key);
        }
    }

    return null;
}

// GET: Fetch settings (no debug data)
export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { data, error } = await supabaseAdmin
        .from(DB_TABLES.SETTINGS)
        .select('*')
        .eq('id', 'main')
        .single();

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}

// PUT: Update settings (whitelisted fields only)
export async function PUT(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    try {
        const body = await request.json();
        const { id, ...rawSettings } = body;

        if (id === undefined || id === null || (typeof id !== 'string' && typeof id !== 'number')) {
            return NextResponse.json({ error: 'Settings ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const settings = sanitizeSettings(rawSettings);

        if (Object.keys(settings).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const payloadError = validateSettingsPayload(settings);
        if (payloadError) {
            return NextResponse.json({ error: payloadError }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const { data, error } = await supabaseAdmin
            .from(DB_TABLES.SETTINGS)
            .update(settings)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/');
        return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        const message = errorMessage(err);
        console.error('Settings PUT error:', message);
        return NextResponse.json(
            { error: 'Failed to update settings', detail: message },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}

// PATCH: Toggle a single boolean field
export async function PATCH(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    try {
        const body = await request.json();
        const { field, value } = body;

        const allowedFields = ['shop_open', 'delivery_enabled'];
        if (!allowedFields.includes(field) || typeof value !== 'boolean') {
            return NextResponse.json({ error: 'Invalid field or value' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const { data: existing } = await supabaseAdmin
            .from(DB_TABLES.SETTINGS)
            .select('id')
            .limit(1)
            .maybeSingle();

        if (!existing) {
            const { error: insertErr } = await supabaseAdmin
                .from(DB_TABLES.SETTINGS)
                .insert({ [field]: value } as Record<string, boolean>);
            if (insertErr) throw insertErr;
            revalidatePath('/');
            return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
        }

        const { error } = await supabaseAdmin
            .from(DB_TABLES.SETTINGS)
            .update({ [field]: value } as Record<string, boolean>)
            .eq('id', existing.id);

        if (error) throw error;
        revalidatePath('/');
        return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        console.error('Settings PATCH error:', errorMessage(err));
        return NextResponse.json(
            { error: 'Failed to toggle setting' },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
