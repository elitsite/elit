import { NextResponse } from 'next/server';
import { cartOrderSchema } from '@/lib/cartValidations';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { z } from 'zod';
import { assertSameOrigin, checkLimitAsync, getClientIp, NO_CACHE_HEADERS, type RateLimitRecord } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';
import { finalPrice } from '@/lib/i18n-content';
import { createHash } from 'crypto';
import { sendOrderTelegram } from '@/lib/telegram';
import { createPayment, getOrderStatus, mapGatewayStatus, sendPaymentTelegram } from '@/lib/paymentGateway';
import { generateAccessToken } from '@/lib/paymentTokens';

// Rate limiting: 5 new cart orders per IP per 10 minutes (applied AFTER dedup)
const cartOrderAttempts = new Map<string, RateLimitRecord>();
const MAX_ORDERS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_IPS = 10000;
const IDEMPOTENCY_WINDOW_MS = 2 * 60 * 1000;

// Anti-double-submit lock: blocks identical (phone + items) requests for 5s
// to prevent race between INSERT of order #1 and dedup query of order #2.
const orderLocks = new Map<string, RateLimitRecord>();
const ORDER_LOCK_WINDOW_MS = 5 * 1000;
const LOCK_RETRY_DELAY_MS = 1500;

function computeItemsFingerprint(items: { id: string; quantity: number }[]): string {
    const normalized = items
        .map(i => `${i.id}:${i.quantity}`)
        .sort()
        .join('|');
    return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Cart order + payment gateway integration.
 * 1. Validate & verify items server-side
 * 2. Dedup within 2-min window (check payment status on existing)
 * 3. Insert order with payment_status='pending'
 * 4. Create payment order via gateway → return redirectUrl
 * 5. Fallback: if gateway unavailable, order still created (fallback:true)
 */
export async function POST(request: Request) {
    try {
        // ── CSRF ──
        const csrfResponse = assertSameOrigin(request);
        if (csrfResponse) return csrfResponse;

        // ── Parse & validate ──
        const body = await request.json();
        const order = cartOrderSchema.parse(body);

        // ── Anti-double-submit lock (race protection) ──
        const earlyFingerprint = computeItemsFingerprint(
            order.items.map(i => ({ id: i.productId, quantity: i.quantity }))
        );
        const lockKey = `${order.phone}:${earlyFingerprint}`;
        const lockCheck = await checkLimitAsync(orderLocks, lockKey, 1, ORDER_LOCK_WINDOW_MS, MAX_TRACKED_IPS, 'cart-lock');
        if (!lockCheck.allowed) {
            await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_DELAY_MS));
        }

        // ── Server-side consent timestamp ──
        const consentAt = new Date().toISOString();

        // ── Server-side price verification for EACH item ──
        const productIds = order.items.map(i => i.productId);
        const { data: products, error: prodErr } = await supabaseAdmin
            .from(DB_TABLES.BOUQUETS)
            .select('id, name, price, discount, in_stock')
            .in('id', productIds);

        if (prodErr || !products) {
            console.error('Failed to fetch products for cart:', prodErr);
            return NextResponse.json({ error: 'Failed to verify products' }, { status: 500, headers: NO_CACHE_HEADERS });
        }

        // Check all items exist and in stock
        const verifiedItems: { id: string; name: string; price: number; quantity: number; finalPrice: number }[] = [];

        // O(1) lookup instead of .find() inside the loop.
        const productById = new Map(products.map(p => [p.id, p]));

        for (const item of order.items) {
            const product = productById.get(item.productId);
            if (!product) {
                return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404, headers: NO_CACHE_HEADERS });
            }
            if (!product.in_stock) {
                return NextResponse.json({ error: `Product out of stock: ${product.name}` }, { status: 400, headers: NO_CACHE_HEADERS });
            }
            verifiedItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                finalPrice: finalPrice(product.price, product.discount),
            });
        }

        // ── Server-side delivery fee from settings ──
        const { data: settingsRow } = await supabaseAdmin
            .from(DB_TABLES.SETTINGS)
            .select('shop_open, delivery_enabled, delivery_price')
            .eq('id', 'main')
            .single();

        // SHOP GUARD: reject new orders when the shop is closed.
        // Fail-open: if settings are unreadable, do not block (settingsRow null).
        if (settingsRow?.shop_open === false) {
            return NextResponse.json({ error: 'Shop is closed' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const deliveryEnabled = settingsRow?.delivery_enabled ?? true;

        // DELIVERY GUARD: reject delivery if disabled
        if (!deliveryEnabled && order.deliveryType === 'delivery') {
            return NextResponse.json({ error: 'Delivery is not available' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        // Parse delivery_price from settings (TEXT column).
        // Supports: "10", "10.5", "10,50", "€10", "10 EUR", etc.
        // DB column delivery_fee is INTEGER, so we round to nearest euro.
        let deliveryFee = 0;
        if (deliveryEnabled && order.deliveryType === 'delivery') {
            const rawPriceStr = String(settingsRow?.delivery_price ?? '0')
                .replace(',', '.')           // normalize EU decimal separator
                .replace(/[^\d.]/g, '');     // strip everything except digits and dot
            const parsed = parseFloat(rawPriceStr);
            deliveryFee = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
        }

        const itemsSubtotal = verifiedItems.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0);
        const serverTotal = itemsSubtotal + deliveryFee;
        const totalQty = verifiedItems.reduce((sum, i) => sum + i.quantity, 0);
        const summaryName = `Order: ${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;

        // ── Dedup: fingerprint from VERIFIED items (2-min window for double-click) ──
        const fingerprint = computeItemsFingerprint(verifiedItems);
        const dedupeSince = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString();

        let dedupeQuery = supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .select('id, items, created_at, payment_id, payment_status, payment_redirect_url')
            .eq('customer_phone', order.phone)
            .eq('order_type', 'cart')
            .eq('delivery_type', order.deliveryType)
            .eq('time_type', order.timeType)
            .gte('created_at', dedupeSince)
            .order('created_at', { ascending: false })
            .limit(5);

        if (order.specificTime) {
            dedupeQuery = dedupeQuery.eq('specific_time', order.specificTime);
        } else {
            dedupeQuery = dedupeQuery.is('specific_time', null);
        }

        if (order.address) {
            dedupeQuery = dedupeQuery.eq('address', order.address);
        } else {
            dedupeQuery = dedupeQuery.is('address', null);
        }

        if (order.comment) {
            dedupeQuery = dedupeQuery.eq('comment', order.comment);
        } else {
            dedupeQuery = dedupeQuery.is('comment', null);
        }

        const { data: existingOrders, error: dedupeError } = await dedupeQuery;
        if (dedupeError) {
            console.error('Cart dedup check failed:', dedupeError);
        }

        // ── Check for existing duplicate ──
        let existingOrder: { id: string; payment_id: string | null; payment_status: string | null; payment_redirect_url: string | null } | null = null;

        if (existingOrders && existingOrders.length > 0) {
            for (const existing of existingOrders) {
                try {
                    if (Array.isArray(existing.items)) {
                        const existingFP = computeItemsFingerprint(
                            existing.items.map((i: { id: string; quantity: number }) => ({ id: i.id, quantity: i.quantity }))
                        );
                        if (existingFP === fingerprint) {
                            existingOrder = {
                                id: existing.id,
                                payment_id: existing.payment_id,
                                payment_status: existing.payment_status,
                                payment_redirect_url: existing.payment_redirect_url ?? null,
                            };
                            break;
                        }
                    }
                } catch {
                    // Corrupted items JSON — skip
                }
            }
        }

        // ── Branch: existing order found ──
        if (existingOrder) {
            const { id: orderId, payment_id, payment_status } = existingOrder;

            // Already paid
            if (payment_status === 'paid') {
                return NextResponse.json(
                    { orderId, alreadyPaid: true },
                    { status: 200, headers: NO_CACHE_HEADERS }
                );
            }

            // Pending with payment_id → check gateway status
            if (payment_status === 'pending' && payment_id) {
                try {
                    const receipt = await getOrderStatus(payment_id);
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

                        return NextResponse.json(
                            { orderId, alreadyPaid: true },
                            { status: 200, headers: NO_CACHE_HEADERS }
                        );
                    }

                    if (mappedStatus === 'pending' && existingOrder.payment_redirect_url) {
                        return NextResponse.json(
                            { orderId, redirectUrl: existingOrder.payment_redirect_url },
                            { status: 200, headers: NO_CACHE_HEADERS }
                        );
                    }

                    // failed/expired → reset and create new payment
                    await supabaseAdmin
                        .from(DB_TABLES.ORDERS)
                        .update({
                            payment_status: 'pending',
                            payment_id: null,
                            payment_error: null,
                            paid_at: null,
                            payment_method_used: null,
                            payment_started_at: null,
                            payment_redirect_url: null,
                        })
                        .eq('id', orderId);

                } catch (receiptErr) {
                    console.error('Payment status check failed during dedup:', receiptErr instanceof Error ? receiptErr.message : receiptErr);
                    if (existingOrder.payment_redirect_url) {
                        return NextResponse.json(
                            { orderId, redirectUrl: existingOrder.payment_redirect_url },
                            { status: 200, headers: NO_CACHE_HEADERS }
                        );
                    }
                }
            }

            // Failed/expired → reset payment fields, create new payment
            if (['failed', 'expired', 'bank_unavailable'].includes(payment_status || '')) {
                await supabaseAdmin
                    .from(DB_TABLES.ORDERS)
                    .update({
                        payment_status: 'pending',
                        payment_id: null,
                        payment_error: null,
                        paid_at: null,
                        payment_method_used: null,
                        payment_started_at: null,
                        payment_redirect_url: null,
                    })
                    .eq('id', orderId);
            }

            // sync_error → do NOT auto-retry, do not disclose internal error class
            if (payment_status === 'sync_error') {
                return NextResponse.json(
                    { orderId, fallback: true },
                    { status: 200, headers: NO_CACHE_HEADERS }
                );
            }

            // ── Create new payment for existing DB order ──
            return await createPaymentAndRespond(orderId, serverTotal, verifiedItems, deliveryFee, itemsSubtotal, order, request);
        }

        // ── Rate limit AFTER dedup (only for genuinely new orders) ──
        const ip = getClientIp(request);
        const { allowed } = await checkLimitAsync(cartOrderAttempts, ip, MAX_ORDERS, WINDOW_MS, MAX_TRACKED_IPS, 'cart-order');
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many orders. Try again later.' },
                { status: 429, headers: { 'Retry-After': '600', ...NO_CACHE_HEADERS } }
            );
        }

        // ── Insert new order with payment_status='pending' ──
        const dbRecord = {
            customer_name: order.name,
            customer_phone: order.phone,
            product_id: verifiedItems[0]?.id || null,
            product_name: summaryName,
            product_price: serverTotal,
            delivery_type: order.deliveryType,
            address: order.address || null,
            time_type: order.timeType,
            specific_time: order.specificTime || null,
            comment: order.comment || null,
            order_type: 'cart',
            items: verifiedItems,
            items_subtotal: itemsSubtotal,
            delivery_fee: deliveryFee,
            consent_at: consentAt,
            payment_status: 'pending',
            payment_id: null,
        };

        const { data: insertedOrder, error: insertError } = await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .insert(dbRecord)
            .select('id')
            .single();

        if (insertError || !insertedOrder) {
            console.error('Failed to save cart order:', insertError);
            return NextResponse.json({ error: 'Failed to save order' }, { status: 500, headers: NO_CACHE_HEADERS });
        }

        // ── Notify shop via Telegram (non-blocking failure) ──
        const itemsSummary = verifiedItems.map(i => `${i.name} ×${i.quantity}`).join(', ');
        await sendOrderTelegram({
            orderId: insertedOrder.id,
            customerName: order.name,
            customerPhone: order.phone,
            itemsSummary,
            itemsSubtotal,
            deliveryFee,
            total: serverTotal,
            deliveryType: order.deliveryType,
            address: order.address,
            timeType: order.timeType,
            specificTime: order.specificTime,
            comment: order.comment,
        });

        // ── Create payment order via gateway ──
        return await createPaymentAndRespond(insertedOrder.id, serverTotal, verifiedItems, deliveryFee, itemsSubtotal, order, request);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        console.error('Cart order error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}

// ── Helper: Create payment order and respond ───────────────────────────

async function createPaymentAndRespond(
    orderId: string,
    serverTotal: number,
    verifiedItems: { id: string; name: string; finalPrice: number; quantity: number }[],
    deliveryFee: number,
    itemsSubtotal: number,
    order: { name: string; phone: string; deliveryType: string; address?: string | null; specificTime?: string | null; comment?: string | null },
    request: Request,
): Promise<NextResponse> {
    // ── Kill switch: payment disabled — order is saved & telegram sent, no online payment ──
    if (process.env.PAYMENT_ENABLED !== 'true') {
        return NextResponse.json(
            { orderId, ok: true },
            { status: 200, headers: NO_CACHE_HEADERS }
        );
    }
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

    // Determine language from accept-language header
    const acceptLang = request.headers.get('accept-language') || '';
    const payLang: 'en' | 'uk' | 'nl' = acceptLang.startsWith('uk') ? 'uk' : acceptLang.startsWith('nl') ? 'nl' : 'en';

    const orderDesc = `Alya Bloemen order ${orderId.slice(0, 8)}`;
    const itemsSummary = verifiedItems.map(i => `${i.name} ×${i.quantity}`).join(', ');

    // Check if payment gateway is configured
    const merchantId = process.env.PAYMENT_MERCHANT_ID;
    const secretKey = process.env.PAYMENT_SECRET_KEY;

    if (!merchantId || !secretKey) {
        // Payment gateway not configured — order saved, but no online payment
        console.log('[cart-order] Payment gateway not configured — order saved without online payment');
        return NextResponse.json(
            { orderId, fallback: true, errorType: 'not_configured' },
            { status: 200, headers: NO_CACHE_HEADERS }
        );
    }

    // Ownership token, embedded in the return URL so only the buyer who
    // initiated this payment can later read /api/payment/status or retry.
    const accessToken = generateAccessToken(orderId);

    try {
        const { paymentId, redirectUrl } = await createPayment({
            orderId,
            totalAmount: serverTotal,
            orderDesc,
            callbackUrl: `${siteUrl}/api/payment/callback`,
            returnUrl: `${siteUrl}/api/payment/return?orderId=${orderId}&t=${accessToken}`,
            lang: payLang,
        });

        // ── UPDATE payment_id + access_token (atomic step) ──
        const { error: updateErr } = await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .update({
                payment_id: paymentId,
                payment_started_at: new Date().toISOString(),
                payment_redirect_url: redirectUrl,
                access_token: accessToken,
            })
            .eq('id', orderId);

        if (updateErr) {
            console.error('SYNC_ERROR: Payment created but DB update failed:', updateErr.message);

            await supabaseAdmin
                .from(DB_TABLES.ORDERS)
                .update({
                    payment_status: 'sync_error',
                    payment_error: `sync_error: DB update failed, payment_id=${paymentId}`,
                })
                .eq('id', orderId);

            await sendPaymentTelegram(orderId, 'sync_error', {
                totalAmount: serverTotal,
                customerName: order.name,
                customerPhone: order.phone,
                itemsSummary,
                itemsSubtotal,
                deliveryFee,
                deliveryType: order.deliveryType,
                address: order.address,
                specificTime: order.specificTime,
                comment: order.comment,
                error: `DB update failed, payment_id=${paymentId}`,
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
        // bank_unavailable: payment creation failed
        const errorMsg = payErr instanceof Error ? payErr.message : 'Unknown payment error';
        console.error('Payment creation failed:', errorMsg);

        await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .update({
                payment_status: 'bank_unavailable',
                payment_error: `bank_unavailable: ${errorMsg.slice(0, 500)}`,
            })
            .eq('id', orderId);

        await sendPaymentTelegram(orderId, 'bank_unavailable', {
            totalAmount: serverTotal,
            customerName: order.name,
            customerPhone: order.phone,
            itemsSummary,
            itemsSubtotal,
            deliveryFee,
            deliveryType: order.deliveryType,
            address: order.address,
            specificTime: order.specificTime,
            comment: order.comment,
            error: errorMsg.slice(0, 200),
        }).catch((err) => console.error('Telegram fallback failed:', err));

        return NextResponse.json(
            { orderId, fallback: true },
            { status: 200, headers: NO_CACHE_HEADERS }
        );
    }
}
