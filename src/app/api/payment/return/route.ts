import { NextResponse } from 'next/server';
import { extractDbOrderId } from '@/lib/paymentGateway';

/**
 * Payment gateway return URL landing endpoint.
 *
 * The gateway redirects the customer back here using either GET or POST.
 * Our /payment/result page is a client component (GET only), so a POST would
 * yield 405. This endpoint accepts BOTH methods and 303-redirects the browser
 * to /payment/result, which then polls /api/payment/status for the real result.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resultRedirect(request: Request, orderId: string | null): NextResponse {
    const base = process.env.SITE_URL || new URL(request.url).origin;
    const target = orderId && UUID_RE.test(orderId)
        ? `${base}/payment/result?orderId=${orderId}`
        : `${base}/payment/result`;
    return NextResponse.redirect(target, 303);
}

export async function GET(request: Request) {
    const orderId = new URL(request.url).searchParams.get('orderId');
    return resultRedirect(request, orderId);
}

export async function POST(request: Request) {
    let orderId = new URL(request.url).searchParams.get('orderId');

    if (!orderId) {
        try {
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const body = await request.json();
                const raw = body?.order_id ?? body?.response?.order_id;
                if (typeof raw === 'string') orderId = extractDbOrderId(raw);
            } else {
                const form = await request.formData();
                const raw = form.get('order_id');
                if (typeof raw === 'string') orderId = extractDbOrderId(raw);
            }
        } catch {
            // Ignore body parse errors
        }
    }

    return resultRedirect(request, orderId);
}
