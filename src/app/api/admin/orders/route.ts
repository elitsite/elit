import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { NO_CACHE_HEADERS, assertSameOrigin } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Explicit column whitelist — keeps payload to what the admin UI actually
// renders and avoids leaking unrelated DB additions to the client.
// payment_* columns are intentionally included so that, when PAYMENT_ENABLED
// is later flipped on, the admin sees session state without another deploy.
const ORDER_COLUMNS = `
    id, status, created_at, order_type,
    product_id, product_name, product_price,
    customer_name, customer_phone,
    delivery_type, address, time_type, specific_time, comment,
    items, items_subtotal, delivery_fee,
    payment_status, payment_id, payment_method_used, payment_error,
    paid_at, payment_started_at, payment_redirect_url,
    consent_at
`;

// GET: List orders (newest first). By default returns cart/regular orders only;
// pass ?type=events to read event inquiries separately.
export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const type = new URL(request.url).searchParams.get('type');

    let query = supabaseAdmin
        .from(DB_TABLES.ORDERS)
        .select(ORDER_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(500);

    if (type === 'events') {
        query = query.eq('order_type', 'event');
    } else {
        // Default view: hide event inquiries from the main order list.
        query = query.neq('order_type', 'event');
    }

    const { data, error } = await query;

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
