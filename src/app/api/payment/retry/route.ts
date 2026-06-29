import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { DB_TABLES } from '@/lib/constants';
import { createPayment, sendPaymentTelegram } from '@/lib/paymentGateway';
import { assertSameOrigin, checkLimitAsync, getClientIp, NO_CACHE_HEADERS, type RateLimitRecord } from '@/lib/apiUtils';
import { generateAccessToken, verifyAccessToken } from '@/lib/paymentTokens';
import { z } from 'zod';

// Rate limit: 5 retries per IP per 10 minutes
const retryAttempts = new Map<string, RateLimitRecord>();
const MAX_RETRIES = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_IPS = 10000;

const retrySchema = z.object({
    orderId: z.string().uuid(),
    accessToken: z.string().min(32).max(128),
});

/**
 * POST /api/payment/retry
 *
 * Retry payment for an existing order using the IMMUTABLE saved snapshot from DB.
 */
export async function POST(request: Request) {
    if (process.env.PAYMENT_ENABLED !== 'true') {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }
    try {
        const csrfResponse = assertSameOrigin(request);
        if (csrfResponse) return csrfResponse;

        const ip = getClientIp(request);
        const { allowed } = await checkLimitAsync(retryAttempts, ip, MAX_RETRIES, WINDOW_MS, MAX_TRACKED_IPS, 'payment-retry');
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many retry attempts. Try again later.' },
                { status: 429, headers: { 'Retry-After': '600', ...NO_CACHE_HEADERS } }
            );
        }

        const body = await request.json();
        const { orderId, accessToken } = retrySchema.parse(body);

        // Ownership check: only the buyer who placed the order may retry.
        if (!verifyAccessToken(orderId, accessToken)) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_CACHE_HEADERS });
        }

        const { data: order, error: findErr } = await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .select('id, order_type, payment_status, payment_id, product_price, items, items_subtotal, delivery_fee, customer_name, customer_phone')
            .eq('id', orderId)
            .single();

        if (findErr || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_CACHE_HEADERS });
        }

        if (order.order_type !== 'cart') {
            return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: NO_CACHE_HEADERS });
        }

        if (order.payment_status === 'paid') {
            return NextResponse.json(
                { orderId, alreadyPaid: true },
                { status: 200, headers: NO_CACHE_HEADERS }
            );
        }

        if (!['failed', 'expired', 'bank_unavailable'].includes(order.payment_status || '')) {
            return NextResponse.json(
                { error: 'Retry not available for current order status' },
                { status: 400, headers: NO_CACHE_HEADERS }
            );
        }

        // SHOP GUARD
        const { data: shopSettings } = await supabaseAdmin
            .from(DB_TABLES.SETTINGS)
            .select('shop_open')
            .eq('id', 'main')
            .single();
        if (shopSettings?.shop_open === false) {
            return NextResponse.json({ error: 'Shop is closed' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        const serverTotal = order.product_price;
        const orderDesc = `Alina Bloemen order ${orderId.slice(0, 8)}`;

        const acceptLang = request.headers.get('accept-language') || '';
        const payLang: 'en' | 'uk' | 'nl' = acceptLang.startsWith('uk') ? 'uk' : acceptLang.startsWith('nl') ? 'nl' : 'en';

        // Token is deterministic (HMAC of orderId), so the same value carries
        // across retries — no need to issue a new one.
        const fresh = generateAccessToken(orderId);

        try {
            // Create payment FIRST. If this throws, the existing DB row is
            // untouched, so the previous redirect / status remain valid.
            const { paymentId, redirectUrl } = await createPayment({
                orderId,
                totalAmount: serverTotal,
                orderDesc,
                callbackUrl: `${siteUrl}/api/payment/callback`,
                returnUrl: `${siteUrl}/api/payment/return?orderId=${orderId}&t=${fresh}`,
                lang: payLang,
            });

            // Atomic state transition: reset stale fields and write the new
            // payment in a single UPDATE.
            const { error: updateErr } = await supabaseAdmin
                .from(DB_TABLES.ORDERS)
                .update({
                    payment_status: 'pending',
                    payment_id: paymentId,
                    payment_started_at: new Date().toISOString(),
                    payment_redirect_url: redirectUrl,
                    payment_error: null,
                    paid_at: null,
                    payment_method_used: null,
                    access_token: fresh,
                })
                .eq('id', orderId);

            if (updateErr) {
                console.error('SYNC_ERROR in retry: Payment created but DB update failed:', updateErr.message);

                await supabaseAdmin
                    .from(DB_TABLES.ORDERS)
                    .update({
                        payment_status: 'sync_error',
                        payment_error: `sync_error: retry DB update failed, payment_id=${paymentId}`,
                    })
                    .eq('id', orderId);

                await sendPaymentTelegram(orderId, 'sync_error', {
                    totalAmount: serverTotal,
                    customerName: order.customer_name,
                    customerPhone: order.customer_phone,
                    error: `retry DB update failed, payment_id=${paymentId}`,
                }).catch((err) => console.error('Telegram fallback failed:', err));

                return NextResponse.json(
                    { orderId, fallback: true, errorType: 'sync_error' },
                    { status: 200, headers: NO_CACHE_HEADERS }
                );
            }

            return NextResponse.json(
                { orderId, redirectUrl },
                { status: 200, headers: NO_CACHE_HEADERS }
            );

        } catch (payErr) {
            const errorMsg = payErr instanceof Error ? payErr.message : 'Unknown payment error';
            console.error('Retry: Payment creation failed:', errorMsg);

            await supabaseAdmin
                .from(DB_TABLES.ORDERS)
                .update({
                    payment_status: 'bank_unavailable',
                    payment_error: `bank_unavailable: retry - ${errorMsg.slice(0, 500)}`,
                })
                .eq('id', orderId);

            await sendPaymentTelegram(orderId, 'bank_unavailable', {
                totalAmount: serverTotal,
                customerName: order.customer_name,
                customerPhone: order.customer_phone,
                error: `retry: ${errorMsg.slice(0, 200)}`,
            }).catch((err) => console.error('Telegram fallback failed:', err));

            return NextResponse.json(
                { orderId, fallback: true },
                { status: 200, headers: NO_CACHE_HEADERS }
            );
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid orderId' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        console.error('Payment retry error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
