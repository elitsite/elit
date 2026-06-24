import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { NO_CACHE_HEADERS, assertSameOrigin } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';

const VALID_SLUGS = new Set(['weddings', 'parties']);

// ── GET: fetch all event pages ──
export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { data, error } = await supabaseAdmin
        .from(DB_TABLES.EVENT_PAGES)
        .select('*')
        .order('slug');

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch event pages' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(data ?? [], { headers: NO_CACHE_HEADERS });
}

// ── PUT: update a single event page content ──
export async function PUT(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    try {
        const body = await request.json();
        const { slug, content } = body as { slug?: string; content?: Record<string, unknown> };

        if (!slug || !VALID_SLUGS.has(slug)) {
            return NextResponse.json({ error: 'Invalid slug' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        if (!content || typeof content !== 'object' || Array.isArray(content)) {
            return NextResponse.json({ error: 'Invalid content' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        // Validate image URLs in content (basic check)
        const imageFields = ['hero_image', 'media_image', 'quote_image'];
        for (const field of imageFields) {
            const val = content[field];
            if (val !== undefined && val !== null && val !== '') {
                if (typeof val !== 'string' || val.length > 2048) {
                    return NextResponse.json({ error: `Invalid URL in ${field}` }, { status: 400, headers: NO_CACHE_HEADERS });
                }
            }
        }

        // Validate arrays
        const arrayFields = ['sections', 'portfolio', 'gallery'];
        for (const field of arrayFields) {
            const val = content[field];
            if (val !== undefined && val !== null) {
                if (!Array.isArray(val) || val.length > 50) {
                    return NextResponse.json({ error: `Invalid array in ${field}` }, { status: 400, headers: NO_CACHE_HEADERS });
                }
            }
        }

        const { data, error } = await supabaseAdmin
            .from(DB_TABLES.EVENT_PAGES)
            .update({ content, updated_at: new Date().toISOString() })
            .eq('slug', slug)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/category/events/weddings');
        revalidatePath('/category/events/parties');
        return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Event pages PUT error:', message);
        return NextResponse.json(
            { error: 'Failed to update event page', detail: message },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
