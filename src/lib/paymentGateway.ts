import { createHash, timingSafeEqual } from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────

export interface CreatePaymentParams {
    orderId: string;
    /** Total order amount in whole EUR (e.g. 50 = €50.00). Converted to cents internally. */
    totalAmount: number;
    orderDesc: string;
    callbackUrl: string;
    returnUrl: string;
    lang: 'en' | 'uk' | 'nl';
}

export interface CreatePaymentResult {
    /** The payment reference ID sent to the gateway (stored in DB payment_id). */
    paymentId: string;
    redirectUrl: string;
}

export interface GatewayOrderResponse {
    order_id?: string;
    order_status?: string;
    response_status?: string;
    amount?: string | number;
    currency?: string;
    payment_id?: string | number;
    payment_system?: string;
    masked_card?: string;
    response_code?: string | number;
    response_description?: string;
    error_code?: number;
    error_message?: string;
    signature?: string;
    [key: string]: unknown;
}

export type OurPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'bank_unavailable' | 'sync_error';

// ── Credentials helper ─────────────────────────────────────────────────

function getCredentials(): { merchantId: string; secretKey: string } {
    const merchantId = process.env.PAYMENT_MERCHANT_ID;
    const secretKey = process.env.PAYMENT_SECRET_KEY;

    if (!merchantId || !secretKey) {
        throw new Error('PAYMENT_MERCHANT_ID and PAYMENT_SECRET_KEY are required');
    }

    return { merchantId, secretKey };
}

// ── Signature ──────────────────────────────────────────────────────────

/**
 * Generate request/response signature.
 * Algorithm: SHA-1 over secretKey + '|' + sorted non-empty values.
 *
 * ⚠️ TODO(PSP-INTEGRATION): Replace this SHA-1 stub with the actual HMAC /
 *   signature algorithm from the chosen bank or crypto-terminal documentation.
 *   This code is NOT production-ready until that substitution is complete.
 *   PAYMENT_ENABLED=false ensures these helpers are never invoked before
 *   integration is finished.
 */
function genSignature(params: Record<string, unknown>, secret: string): string {
    const keys = Object.keys(params)
        .filter((k) => k !== 'signature' && k !== 'response_signature_string')
        .sort();

    const values: string[] = [];
    for (const key of keys) {
        const value = params[key];
        if (value === '' || value === null || value === undefined) continue;
        values.push(String(value));
    }

    const signString = secret + '|' + values.join('|');
    return createHash('sha1').update(signString, 'utf-8').digest('hex');
}

/**
 * Verify the signature of a gateway callback / response payload.
 * Replace with the specific verification of your chosen bank.
 */
export function verifyCallbackSignature(body: Record<string, unknown>, secret: string): boolean {
    const provided = body.signature;
    if (!provided || typeof provided !== 'string') return false;
    const expected = genSignature(body, secret);
    if (expected.length !== provided.length) return false;
    try {
        return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
        return false;
    }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Recover our DB order UUID from a gateway order_id.
 * We send `{uuid}-{suffix}` to the gateway; the canonical UUID is the first 36 chars.
 * Returns null if the prefix is not a valid UUID — callers must short-circuit
 * to avoid DB lookups on attacker-controlled values.
 */
export function extractDbOrderId(gatewayOrderId: string): string | null {
    if (typeof gatewayOrderId !== 'string' || gatewayOrderId.length < 36) return null;
    const candidate = gatewayOrderId.slice(0, 36);
    return UUID_RE.test(candidate) ? candidate : null;
}

// ── Create Payment Order ───────────────────────────────────────────────

/**
 * Create a payment order and return the checkout redirect URL + payment id.
 *
 * ABSTRACT IMPLEMENTATION: This is a placeholder that mirrors the Flitt API
 * structure. When the actual bank is chosen, replace the endpoint URL,
 * request/response format, and signature algorithm as needed.
 */
export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const { merchantId, secretKey } = getCredentials();

    // Amount in minor units (cents). €50 → 5000.
    const amountCents = Math.round(params.totalAmount * 100);

    // Unique order_id per attempt to avoid duplicate rejection on retries.
    const sentOrderId = `${params.orderId}-${Date.now().toString(36)}`;

    const gatewayUrl = process.env.PAYMENT_GATEWAY_URL || 'https://gateway.example.com/api/checkout/url';

    const requestParams: Record<string, unknown> = {
        order_id: sentOrderId,
        merchant_id: merchantId,
        order_desc: params.orderDesc,
        amount: amountCents,
        currency: 'EUR',
        response_url: params.returnUrl,
        server_callback_url: params.callbackUrl,
        lang: params.lang,
        lifetime: 900, // 15 minutes
        delayed: 'N',
    };

    requestParams.signature = genSignature(requestParams, secretKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request: requestParams }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Payment gateway create payment failed: ${response.status} ${text.slice(0, 300)}`);
        }

        const json = await response.json();
        const data: GatewayOrderResponse = json?.response ?? json ?? {};

        if (data.response_status === 'failure' || data.error_code) {
            throw new Error(`Payment gateway error: ${data.error_code ?? ''} ${data.error_message ?? ''}`.trim());
        }

        const checkoutUrl = (data.checkout_url as string | undefined) || (data.redirect_url as string | undefined);

        if (!checkoutUrl) {
            throw new Error('Payment gateway: invalid response — missing checkout URL');
        }

        return {
            paymentId: sentOrderId,
            redirectUrl: checkoutUrl,
        };
    } finally {
        clearTimeout(timeout);
    }
}

// ── Get Order Status ───────────────────────────────────────────────────

/**
 * Fetch order status by the order_id we sent to the gateway on creation.
 */
export async function getOrderStatus(orderReference: string): Promise<GatewayOrderResponse> {
    const { merchantId, secretKey } = getCredentials();

    const statusUrl = process.env.PAYMENT_STATUS_URL || 'https://gateway.example.com/api/status/order_id';

    const requestParams: Record<string, unknown> = {
        order_id: orderReference,
        merchant_id: merchantId,
    };

    requestParams.signature = genSignature(requestParams, secretKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
        const response = await fetch(statusUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request: requestParams }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Payment gateway get status failed: ${response.status} ${text.slice(0, 200)}`);
        }

        const json = await response.json();
        const data: GatewayOrderResponse = json?.response ?? json ?? {};

        if (data.response_status === 'failure' || data.error_code) {
            throw new Error(`Payment gateway get status error: ${data.error_code ?? ''} ${data.error_message ?? ''}`.trim());
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

// ── Status Mapping ─────────────────────────────────────────────────────

/**
 * Map a gateway order_status to our internal status.
 *
 * Common statuses (adjust when the actual bank is chosen):
 *   created / processing → pending
 *   approved             → paid
 *   declined             → failed
 *   expired              → expired
 *   reversed             → failed (refund)
 */
export function mapGatewayStatus(
    data: GatewayOrderResponse
): { status: OurPaymentStatus; paymentMethodUsed: string | null } {
    const orderStatus = data.order_status;
    const paymentMethodUsed = data.payment_system ? String(data.payment_system) : null;

    switch (orderStatus) {
        case 'approved':
        case 'success':
        case 'paid':
            return { status: 'paid', paymentMethodUsed };

        case 'declined':
        case 'failed':
            return { status: 'failed', paymentMethodUsed: null };

        case 'expired':
            return { status: 'expired', paymentMethodUsed: null };

        case 'created':
        case 'processing':
        case 'pending':
            return { status: 'pending', paymentMethodUsed: null };

        case 'reversed':
        case 'refunded':
            return { status: 'failed', paymentMethodUsed: null };

        default:
            console.error('Unknown gateway order status:', orderStatus);
            return { status: 'failed', paymentMethodUsed: null };
    }
}

// ── Telegram Notification Helper ───────────────────────────────────────

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Send Telegram notification for payment events.
 * Only for: paid ✅, bank_unavailable ⚠️, sync_error ⛔
 */
export async function sendPaymentTelegram(
    orderId: string,
    status: 'paid' | 'bank_unavailable' | 'sync_error',
    details: {
        totalAmount?: number;
        customerName?: string;
        customerPhone?: string;
        paymentMethod?: string | null;
        error?: string;
        itemsSummary?: string;
        deliveryType?: string;
        address?: string | null;
        specificTime?: string | null;
        comment?: string | null;
        deliveryFee?: number;
        itemsSubtotal?: number;
    } = {}
): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    let emoji: string;
    let title: string;
    let statusLine: string;

    switch (status) {
        case 'paid':
            emoji = '✅';
            title = 'PAYMENT RECEIVED';
            statusLine = `💳 Method: ${details.paymentMethod || 'unknown'}`;
            break;
        case 'bank_unavailable':
            emoji = '⚠️';
            title = 'BANK UNAVAILABLE';
            statusLine = `❌ Error: ${escapeHtml(details.error || 'unknown')}`;
            break;
        case 'sync_error':
            emoji = '⛔';
            title = 'SYNC ERROR';
            statusLine = `❌ Error: ${escapeHtml(details.error || 'DB sync failed')}`;
            break;
    }

    const deliveryLabel = details.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup';
    const priceBreakdown = details.deliveryFee && details.deliveryFee > 0 && details.itemsSubtotal
        ? `💰 Items: €${details.itemsSubtotal} + Delivery: €${details.deliveryFee} = €${details.totalAmount}`
        : details.totalAmount ? `💰 €${details.totalAmount}` : '';

    const lines = [
        `${emoji} <b>${title}</b> ${emoji}`,
        '',
        `🆔 Order: ${orderId.slice(0, 8)}...`,
        details.customerName ? `👤 ${escapeHtml(details.customerName)}` : '',
        details.customerPhone ? `📞 ${details.customerPhone}` : '',
        details.itemsSummary ? `📦 ${escapeHtml(details.itemsSummary)}` : '',
        priceBreakdown,
        details.deliveryType ? deliveryLabel : '',
        details.address ? `📍 ${escapeHtml(details.address)}` : '',
        details.specificTime ? `🕐 ${details.specificTime}` : '',
        details.comment ? `💬 ${escapeHtml(details.comment)}` : '',
        statusLine,
    ].filter(Boolean);

    const message = lines.join('\n').trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            console.error(`Payment Telegram failed: ${response.status} ${errorBody.slice(0, 300)}`);
        }
    } catch (err) {
        console.error('Payment Telegram notification failed:', err instanceof Error ? err.message : err);
    } finally {
        clearTimeout(timeout);
    }
}
