import { NextResponse } from 'next/server';
import { NO_CACHE_HEADERS } from '@/lib/apiUtils';

function paymentDisabled(): NextResponse | null {
    if (process.env.PAYMENT_ENABLED !== 'true') {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }
    return null;
}

/**
 * Payment return URL landing endpoint (GET /api/payment/return).
 *
 * Rabo Smart Pay redirects the customer back to our merchantReturnURL after
 * payment completion/cancellation. The return URL includes our orderId and
 * access token as query parameters (set during createPayment).
 *
 * Additionally, Rabo appends `order_id`, `status`, and `signature` query params
 * which can be used for immediate client-side feedback (not relied on for
 * authoritative status — that comes via webhook).
 *
 * We 303-redirect to /payment/result which polls /api/payment/status.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resultRedirect(request: Request): NextResponse {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const t = url.searchParams.get('t');

    const base = process.env.SITE_URL || url.origin;

    let target = `${base}/payment/result`;
    if (orderId && UUID_RE.test(orderId)) {
        target += `?orderId=${orderId}`;
        if (t) target += `&t=${encodeURIComponent(t)}`;
    }

    return NextResponse.redirect(target, 303);
}

export async function GET(request: Request) {
    const blocked = paymentDisabled();
    if (blocked) return blocked;
    return resultRedirect(request);
}

export async function POST(request: Request) {
    const blocked = paymentDisabled();
    if (blocked) return blocked;
    return resultRedirect(request);
}
