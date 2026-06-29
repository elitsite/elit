import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { DB_TABLES } from '@/lib/constants';
import {
    verifyAnnouncementSignature,
    verifyStatusResponseSignature,
    retrieveOrderResults,
    extractDbOrderId,
    mapRaboOrderStatus,
    sendPaymentTelegram,
    type RaboAnnouncementPayload,
    type RaboMerchantOrderResult,
} from '@/lib/paymentGateway';
import { NO_CACHE_HEADERS } from '@/lib/apiUtils';

/**
 * Rabo Smart Pay Webhook Handler (POST /api/payment/callback)
 *
 * Rabo sends a "trigger" notification with authentication + eventName.
 * We must:
 * 1. Verify the announcement signature (HMAC-SHA512)
 * 2. Pull actual order results using the announcement's auth token
 * 3. Verify the status response signature
 * 4. Process each order result and update DB
 *
 * We MUST return HTTP 200 (otherwise Rabo retries).
 */
export async function POST(request: Request) {
    if (process.env.PAYMENT_ENABLED !== 'true') {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }
    try {
        // ── Step 1: Parse announcement body ──
        let announcement: RaboAnnouncementPayload;
        try {
            announcement = await request.json();
        } catch {
            console.error('Callback: invalid JSON body');
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // Basic shape validation
        if (!announcement.authentication || !announcement.eventName || !announcement.signature) {
            console.error('Callback: missing required announcement fields');
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 2: Verify announcement signature ──
        if (!verifyAnnouncementSignature(announcement)) {
            console.error('Callback: invalid announcement signature');
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 3: Pull order results using the announcement ──
        let statusResponse;
        try {
            statusResponse = await retrieveOrderResults(announcement);
        } catch (pullErr) {
            console.error('Callback: failed to retrieve order results:', pullErr instanceof Error ? pullErr.message : pullErr);
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 4: Verify status response signature ──
        if (!verifyStatusResponseSignature(statusResponse)) {
            console.error('Callback: invalid status response signature');
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 5: Process each order result ──
        for (const orderResult of statusResponse.orderResults) {
            await processOrderResult(orderResult);
        }

        // ── Step 6: If more results available, pull again ──
        // Rabo may batch results; loop until no more
        if (statusResponse.moreOrderResultsAvailable) {
            try {
                let more = true;
                while (more) {
                    const nextResponse = await retrieveOrderResults(announcement);
                    if (!verifyStatusResponseSignature(nextResponse)) {
                        console.error('Callback: invalid signature on subsequent pull');
                        break;
                    }
                    for (const orderResult of nextResponse.orderResults) {
                        await processOrderResult(orderResult);
                    }
                    more = nextResponse.moreOrderResultsAvailable;
                }
            } catch (moreErr) {
                console.error('Callback: error pulling more results:', moreErr instanceof Error ? moreErr.message : moreErr);
            }
        }

        return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });

    } catch (error) {
        // ALWAYS return 200 to Rabo — even on our errors
        console.error('Callback handler error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
    }
}

/**
 * Process a single MerchantOrderResult from Rabo Smart Pay.
 */
async function processOrderResult(orderResult: RaboMerchantOrderResult): Promise<void> {
    const orderId = extractDbOrderId(orderResult.merchantOrderId);
    if (!orderId) {
        console.error('Callback: invalid merchantOrderId format:', orderResult.merchantOrderId);
        return;
    }

    const { data: dbOrder, error: findErr } = await supabaseAdmin
        .from(DB_TABLES.ORDERS)
        .select('id, payment_id, payment_status, product_price, order_type, customer_name, customer_phone, items_subtotal, delivery_fee, items, delivery_type, address, specific_time, comment')
        .eq('id', orderId)
        .single();

    if (findErr || !dbOrder) {
        console.error('Callback: order not found in DB:', orderId);
        return;
    }

    // Already paid — skip
    if (dbOrder.payment_status === 'paid') {
        return;
    }

    // Map Rabo status to our internal status
    const { status: mappedStatus, paymentMethodUsed } = mapRaboOrderStatus(orderResult);

    if (mappedStatus === 'paid') {
        await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .update({
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method_used: paymentMethodUsed,
            })
            .eq('id', dbOrder.id);

        const itemsSummary = Array.isArray(dbOrder.items)
            ? (dbOrder.items as { name: string; quantity: number }[]).map(i => `${i.name} ×${i.quantity}`).join(', ')
            : '';

        await sendPaymentTelegram(dbOrder.id, 'paid', {
            totalAmount: dbOrder.product_price,
            customerName: dbOrder.customer_name,
            customerPhone: dbOrder.customer_phone,
            paymentMethod: paymentMethodUsed,
            itemsSummary,
            itemsSubtotal: dbOrder.items_subtotal,
            deliveryFee: dbOrder.delivery_fee,
            deliveryType: (dbOrder as Record<string, unknown>).delivery_type as string,
            address: (dbOrder as Record<string, unknown>).address as string | null,
            specificTime: (dbOrder as Record<string, unknown>).specific_time as string | null,
            comment: (dbOrder as Record<string, unknown>).comment as string | null,
        }).catch((err) => console.error('Telegram success failed:', err));

    } else if (mappedStatus === 'expired' || mappedStatus === 'failed') {
        await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .update({
                payment_status: mappedStatus,
                payment_error: orderResult.errorCode || null,
            })
            .eq('id', dbOrder.id);
    }
    // pending (IN_PROGRESS) → no update needed
}
