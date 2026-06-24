import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { DB_TABLES } from '@/lib/constants';
import { getOrderStatus, mapGatewayStatus } from '@/lib/paymentGateway';
import { checkLimitAsync, getClientIp, NO_CACHE_HEADERS, type RateLimitRecord } from '@/lib/apiUtils';

// Rate limit: 40 req/min per IP
const statusAttempts = new Map<string, RateLimitRecord>();
const MAX_REQUESTS = 40;
const WINDOW_MS = 60 * 1000;
const MAX_TRACKED_IPS = 10000;

/**
 * GET /api/payment/status?orderId=<uuid>
 *
 * Used by /payment/result for polling.
 * Returns current payment status, with reconciliation for stale pending orders.
 */
export async function GET(request: Request) {
    try {
        const ip = getClientIp(request);
        const { allowed } = await checkLimitAsync(statusAttempts, ip, MAX_REQUESTS, WINDOW_MS, MAX_TRACKED_IPS, 'payment-status');
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { status: 429, headers: { 'Retry-After': '60', ...NO_CACHE_HEADERS } }
            );
        }

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
            return NextResponse.json({ error: 'Invalid orderId' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const { data: order, error: findErr } = await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .select('id, payment_status, payment_id, paid_at, payment_method_used, payment_error, created_at, product_price, payment_started_at')
            .eq('id', orderId)
            .single();

        if (findErr || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_CACHE_HEADERS });
        }

        // ── Final statuses → return immediately ──
        if (['paid', 'failed', 'expired', 'bank_unavailable', 'sync_error'].includes(order.payment_status || '')) {
            return NextResponse.json({
                status: order.payment_status,
                paidAt: order.paid_at,
                paymentMethod: order.payment_method_used,
                error: order.payment_error,
            }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Pending with payment_id ──
        if (order.payment_status === 'pending' && order.payment_id) {
            const sessionStart = order.payment_started_at || order.created_at;
            const createdAt = new Date(sessionStart).getTime();
            const elapsed = Date.now() - createdAt;
            const FIVE_MIN = 5 * 60 * 1000;
            const TWENTY_MIN = 20 * 60 * 1000;

            if (elapsed < FIVE_MIN) {
                return NextResponse.json(
                    { status: 'pending' },
                    { status: 200, headers: NO_CACHE_HEADERS }
                );
            }

            // ≥ 5 min → reconcile via gateway status API
            try {
                const receipt = await getOrderStatus(order.payment_id);
                const { status: mappedStatus, paymentMethodUsed } = mapGatewayStatus(receipt);

                if (mappedStatus === 'paid') {
                    await supabaseAdmin
                        .from(DB_TABLES.ORDERS)
                        .update({
                            payment_status: 'paid',
                            paid_at: new Date().toISOString(),
                            payment_method_used: paymentMethodUsed,
                        })
                        .eq('id', orderId);

                    return NextResponse.json({
                        status: 'paid',
                        paidAt: new Date().toISOString(),
                        paymentMethod: paymentMethodUsed,
                    }, { status: 200, headers: NO_CACHE_HEADERS });
                }

                if (mappedStatus === 'expired' || mappedStatus === 'failed') {
                    const errorDetail = receipt.response_code != null && receipt.response_code !== ''
                        ? String(receipt.response_code)
                        : (receipt.response_description ? String(receipt.response_description) : null);
                    await supabaseAdmin
                        .from(DB_TABLES.ORDERS)
                        .update({
                            payment_status: mappedStatus,
                            payment_error: errorDetail,
                        })
                        .eq('id', orderId);

                    return NextResponse.json({
                        status: mappedStatus,
                        error: errorDetail,
                    }, { status: 200, headers: NO_CACHE_HEADERS });
                }

                // Still pending — > 20 min and still created → expire
                if (elapsed > TWENTY_MIN && receipt.order_status === 'created') {
                    await supabaseAdmin
                        .from(DB_TABLES.ORDERS)
                        .update({
                            payment_status: 'expired',
                            payment_error: 'Timeout: order created but never processed',
                        })
                        .eq('id', orderId);

                    return NextResponse.json({
                        status: 'expired',
                        error: 'Payment session expired',
                    }, { status: 200, headers: NO_CACHE_HEADERS });
                }

                return NextResponse.json(
                    { status: 'pending' },
                    { status: 200, headers: NO_CACHE_HEADERS }
                );

            } catch (receiptErr) {
                console.error('Status reconciliation failed:', receiptErr instanceof Error ? receiptErr.message : receiptErr);
                return NextResponse.json(
                    { status: 'pending' },
                    { status: 200, headers: NO_CACHE_HEADERS }
                );
            }
        }

        // ── Pending with no payment_id → failed initialization ──
        if (order.payment_status === 'pending' && !order.payment_id) {
            await supabaseAdmin
                .from(DB_TABLES.ORDERS)
                .update({
                    payment_status: 'bank_unavailable',
                    payment_error: 'init_failed',
                })
                .eq('id', orderId);

            return NextResponse.json({
                status: 'bank_unavailable',
                error: 'Payment initialization failed',
            }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── No payment_status (legacy order or null) ──
        return NextResponse.json(
            { status: order.payment_status || 'unknown' },
            { status: 200, headers: NO_CACHE_HEADERS }
        );

    } catch (error) {
        console.error('Payment status error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
