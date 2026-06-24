import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { DB_TABLES } from '@/lib/constants';
import { mapGatewayStatus, sendPaymentTelegram, verifyCallbackSignature, extractDbOrderId, type GatewayOrderResponse } from '@/lib/paymentGateway';
import { NO_CACHE_HEADERS } from '@/lib/apiUtils';

/**
 * Payment Gateway Callback Handler
 *
 * Called by the payment gateway server-to-server when payment reaches a final status.
 * We MUST return HTTP 200 (otherwise the gateway retries).
 */
export async function POST(request: Request) {
    try {
        // ── Step 1: Parse body ──
        let callbackData: GatewayOrderResponse;
        try {
            callbackData = await request.json();
        } catch {
            console.error('Callback: invalid JSON body');
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 2: Verify signature ──
        const secretKey = process.env.PAYMENT_SECRET_KEY;
        if (!secretKey) {
            console.error('Callback: PAYMENT_SECRET_KEY not configured');
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }
        if (!verifyCallbackSignature(callbackData as Record<string, unknown>, secretKey)) {
            console.error('Callback: invalid signature for order_id:', callbackData?.order_id);
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 3: Recover our DB UUID from the gateway order_id ──
        const gatewayOrderId = callbackData?.order_id;
        if (!gatewayOrderId || typeof gatewayOrderId !== 'string') {
            console.error('Callback: missing order_id in body');
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }
        const orderId = extractDbOrderId(gatewayOrderId);

        const { data: dbOrder, error: findErr } = await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .select('id, payment_id, payment_status, product_price, order_type, customer_name, customer_phone, items_subtotal, delivery_fee, items, delivery_type, address, specific_time, comment')
            .eq('id', orderId)
            .single();

        if (findErr || !dbOrder) {
            console.error('Callback: order_id not found in DB:', orderId);
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // Already paid — skip
        if (dbOrder.payment_status === 'paid') {
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 4: Verify amount (cents) and currency ──
        const expectedCents = dbOrder.product_price * 100;
        if (callbackData.amount !== undefined && Number(callbackData.amount) !== expectedCents) {
            console.error('Callback: amount mismatch:', callbackData.amount, '!==', expectedCents);
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        if (callbackData.currency && callbackData.currency !== 'EUR') {
            console.error('Callback: unexpected currency:', callbackData.currency);
            return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
        }

        // ── Step 5: Map status and update DB ──
        const { status: mappedStatus, paymentMethodUsed } = mapGatewayStatus(callbackData);

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
                    payment_error: callbackData.response_code != null && callbackData.response_code !== ''
                        ? String(callbackData.response_code)
                        : (callbackData.response_description ? String(callbackData.response_description) : null),
                })
                .eq('id', dbOrder.id);
        }
        // pending → no update needed (still waiting)

        return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });

    } catch (error) {
        // ALWAYS return 200 to the gateway — even on our errors
        console.error('Callback handler error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ ok: true }, { status: 200, headers: NO_CACHE_HEADERS });
    }
}
