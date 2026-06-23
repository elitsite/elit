import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { NO_CACHE_HEADERS, assertSameOrigin } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET: List all orders (newest first, with limit)
export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { data, error } = await supabaseAdmin
        .from(DB_TABLES.ORDERS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}

// PATCH: Update order status
export async function PATCH(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    try {
        const { id, status } = await request.json();

        const allowedStatuses = ['new', 'confirmed', 'completed', 'cancelled'];
        if (!id || typeof id !== 'string' || !UUID_RE.test(id) || !allowedStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid id or status' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const { error } = await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        console.error('Failed to update order:', err);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
