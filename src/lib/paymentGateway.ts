import { createHmac, timingSafeEqual } from 'crypto';
import { randomUUID } from 'crypto';

// ══════════════════════════════════════════════════════════════════════════
// Rabo Smart Pay (OmniKassa 2.0) — TypeScript integration
// Direct REST API + HMAC-SHA512 signature verification
// ══════════════════════════════════════════════════════════════════════════

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
    /** The omnikassaOrderId returned by Rabo (stored in DB payment_id). */
    paymentId: string;
    redirectUrl: string;
}

/** Rabo Smart Pay order statuses */
export type RaboOrderStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

/** Rabo Smart Pay transaction statuses */
export type RaboTransactionStatus = 'SUCCESS' | 'CANCELLED' | 'EXPIRED' | 'FAILURE' | 'OPEN' | 'NEW' | 'ACCEPTED';

export interface RaboMoney {
    currency: string;
    amount: number; // cents
}

export interface RaboTransactionInfo {
    id: string;
    paymentBrand: string;
    type: string;
    status: RaboTransactionStatus;
    amount: RaboMoney;
    confirmedAmount?: RaboMoney | null;
    startTime: string;
    lastUpdateTime: string;
}

export interface RaboMerchantOrderResult {
    merchantOrderId: string;
    omnikassaOrderId: string;
    poiId: number;
    orderStatus: RaboOrderStatus;
    orderStatusDateTime: string;
    errorCode: string;
    paidAmount: RaboMoney;
    totalAmount: RaboMoney;
    transactions?: RaboTransactionInfo[];
}

export interface RaboMerchantOrderStatusResponse {
    moreOrderResultsAvailable: boolean;
    orderResults: RaboMerchantOrderResult[];
    signature: string;
}

export interface RaboAnnouncementPayload {
    authentication: string;
    expiry: string;
    eventName: string;
    poiId: number;
    signature: string;
}

export interface RaboAccessToken {
    token: string;
    validUntil: string;
    durationInMillis: number;
}

export type OurPaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'bank_unavailable' | 'sync_error';

// ── Environment & Configuration ────────────────────────────────────────

const RABO_PRODUCTION_BASE = 'https://api.pay.rabobank.nl';
const RABO_SANDBOX_BASE = 'https://api.pay-sandbox.rabobank.nl';

function getRaboBaseUrl(): string {
    const env = process.env.RABO_ENVIRONMENT || 'sandbox';
    return env === 'production' ? RABO_PRODUCTION_BASE : RABO_SANDBOX_BASE;
}

function getRaboRefreshToken(): string {
    const token = process.env.RABO_REFRESH_TOKEN;
    if (!token) throw new Error('RABO_REFRESH_TOKEN is required');
    return token;
}

function getRaboSigningKey(): Buffer {
    const key = process.env.RABO_SIGNING_KEY;
    if (!key) throw new Error('RABO_SIGNING_KEY is required');
    return Buffer.from(key, 'base64');
}

// ── HMAC-SHA512 Signature Utilities ────────────────────────────────────

/**
 * Recursively flatten nested arrays and join with comma.
 * Mirrors the PHP SDK's Signable::flattenAndJoin().
 */
function flattenDeep(arr: unknown[]): string[] {
    const result: string[] = [];
    for (const item of arr) {
        if (Array.isArray(item)) {
            result.push(...flattenDeep(item));
        } else {
            result.push(String(item ?? ''));
        }
    }
    return result;
}

function calculateSignature(signatureData: unknown[], signingKey: Buffer): string {
    const flattened = flattenDeep(signatureData);
    const payload = flattened.join(',');
    return createHmac('sha512', signingKey).update(payload, 'utf8').digest('hex');
}

/**
 * Verify HMAC-SHA512 signature (timing-safe).
 */
function verifySignature(signatureData: unknown[], expectedSignature: string, signingKey: Buffer): boolean {
    const calculated = calculateSignature(signatureData, signingKey);
    if (calculated.length !== expectedSignature.length) return false;
    try {
        return timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(expectedSignature, 'hex'));
    } catch {
        return false;
    }
}

// ── Signature Data Builders ────────────────────────────────────────────

function moneySignatureData(money: RaboMoney): [string, number] {
    return [money.currency, money.amount];
}

function transactionSignatureData(tx: RaboTransactionInfo): unknown[] {
    return [
        tx.id,
        tx.paymentBrand,
        tx.type,
        tx.status,
        moneySignatureData(tx.amount),
        tx.confirmedAmount ? moneySignatureData(tx.confirmedAmount) : [null, null],
        tx.startTime,
        tx.lastUpdateTime,
    ];
}

function orderResultSignatureData(result: RaboMerchantOrderResult): unknown[] {
    const data: unknown[] = [
        result.merchantOrderId,
        result.omnikassaOrderId,
        result.poiId,
        result.orderStatus,
        result.orderStatusDateTime,
        result.errorCode,
        moneySignatureData(result.paidAmount),
        moneySignatureData(result.totalAmount),
    ];
    if (result.transactions) {
        for (const tx of result.transactions) {
            data.push(transactionSignatureData(tx));
        }
    }
    return data;
}

function statusResponseSignatureData(response: RaboMerchantOrderStatusResponse): unknown[] {
    const orderResultsData: unknown[] = [];
    for (const result of response.orderResults) {
        orderResultsData.push(orderResultSignatureData(result));
    }
    return [
        response.moreOrderResultsAvailable ? 'true' : 'false',
        orderResultsData,
    ];
}

function announcementSignatureData(announcement: RaboAnnouncementPayload): unknown[] {
    return [announcement.authentication, announcement.expiry, announcement.eventName, announcement.poiId];
}

// ── Access Token Management ────────────────────────────────────────────

let cachedAccessToken: RaboAccessToken | null = null;

function isTokenExpired(token: RaboAccessToken): boolean {
    const validUntil = new Date(token.validUntil).getTime();
    const now = Date.now();
    const durationMs = token.durationInMillis;
    const remaining = validUntil - now;
    return (remaining / durationMs) < 0.05;
}

async function getAccessToken(): Promise<string> {
    if (cachedAccessToken && !isTokenExpired(cachedAccessToken)) {
        return cachedAccessToken.token;
    }

    const baseUrl = getRaboBaseUrl();
    const refreshToken = getRaboRefreshToken();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
        const response = await fetch(`${baseUrl}/omnikassa-api/gatekeeper/refresh`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${refreshToken}`,
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Rabo token refresh failed: ${response.status} ${text.slice(0, 300)}`);
        }

        const data: RaboAccessToken = await response.json();
        cachedAccessToken = data;
        return data.token;
    } finally {
        clearTimeout(timeout);
    }
}

// ── Public: Verify Announcement (Webhook) Signature ────────────────────

/**
 * Verify the webhook announcement POST from Rabo Smart Pay.
 * Returns the parsed announcement if valid, null otherwise.
 */
export function verifyAnnouncementSignature(body: RaboAnnouncementPayload): boolean {
    const signingKey = getRaboSigningKey();
    const sigData = announcementSignatureData(body);
    return verifySignature(sigData, body.signature, signingKey);
}

// ── Public: Verify Order Status Response Signature ─────────────────────

export function verifyStatusResponseSignature(response: RaboMerchantOrderStatusResponse): boolean {
    const signingKey = getRaboSigningKey();
    const sigData = statusResponseSignatureData(response);
    return verifySignature(sigData, response.signature, signingKey);
}

// ── Public: Retrieve Order Results (webhook-pull) ──────────────────────

/**
 * After receiving a webhook announcement, pull the actual order results
 * using the authentication token and eventName from the announcement.
 */
export async function retrieveOrderResults(announcement: RaboAnnouncementPayload): Promise<RaboMerchantOrderStatusResponse> {
    const baseUrl = getRaboBaseUrl();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
        const response = await fetch(
            `${baseUrl}/omnikassa-api/order/server/api/events/results/${announcement.eventName}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${announcement.authentication}`,
                },
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Rabo retrieveOrderResults failed: ${response.status} ${text.slice(0, 300)}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

// ── Public: extractDbOrderId ───────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_NO_HYPHENS_RE = /^[0-9a-f]{32}$/i;

/**
 * Convert DB UUID to Rabo-safe merchantOrderId (alphanumeric only, hyphens removed).
 * e.g. "550e8400-e29b-41d4-a716-446655440000" → "550e8400e29b41d4a716446655440000"
 */
export function toRaboMerchantOrderId(dbOrderId: string): string {
    return dbOrderId.replace(/-/g, '');
}

/**
 * Convert Rabo merchantOrderId (no hyphens) back to DB UUID format.
 * e.g. "550e8400e29b41d4a716446655440000" → "550e8400-e29b-41d4-a716-446655440000"
 */
export function extractDbOrderId(merchantOrderId: string): string | null {
    if (typeof merchantOrderId !== 'string') return null;
    const candidate = merchantOrderId.trim();
    if (UUID_RE.test(candidate)) return candidate;
    if (UUID_NO_HYPHENS_RE.test(candidate)) {
        return candidate.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
    }
    return null;
}

// ── Public: Create Payment (Announce Order) ────────────────────────────

/**
 * Announce an order to Rabo Smart Pay.
 * Returns the redirect URL to the hosted payment page + the omnikassaOrderId.
 */
export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const accessToken = await getAccessToken();
    const baseUrl = getRaboBaseUrl();

    // Amount in cents
    const amountCents = Math.round(params.totalAmount * 100);

    // Map language code
    const langMap: Record<string, string> = { nl: 'NL', en: 'EN', uk: 'EN' };
    const language = langMap[params.lang] || 'NL';

    const merchantOrder = {
        merchantOrderId: toRaboMerchantOrderId(params.orderId),
        description: params.orderDesc,
        amount: {
            currency: 'EUR',
            amount: amountCents,
        },
        merchantReturnURL: params.returnUrl,
        language,
        // Do NOT set paymentBrand or paymentBrandForce — let all methods appear
    };

    const orderRequest = {
        timestamp: new Date().toISOString(),
        ...merchantOrder,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
        const response = await fetch(`${baseUrl}/omnikassa-api/order/server/api/v2/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Request-ID': randomUUID(),
            },
            body: JSON.stringify(orderRequest),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Rabo announce order failed: ${response.status} ${text.slice(0, 300)}`);
        }

        const data = await response.json();
        const redirectUrl: string | undefined = data.redirectUrl;
        const omnikassaOrderId: string | undefined = data.omnikassaOrderId;

        if (!redirectUrl) {
            throw new Error('Rabo Smart Pay: invalid response — missing redirectUrl');
        }

        return {
            paymentId: omnikassaOrderId || params.orderId,
            redirectUrl,
        };
    } finally {
        clearTimeout(timeout);
    }
}

// ── Public: Get Order Status (active poll) ─────────────────────────────

/**
 * Fetch order details by omnikassaOrderId.
 * Used for reconciliation when webhook hasn't arrived yet.
 */
export async function getOrderStatus(omnikassaOrderId: string): Promise<RaboMerchantOrderResult | null> {
    const accessToken = await getAccessToken();
    const baseUrl = getRaboBaseUrl();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
        const response = await fetch(`${baseUrl}/v2/orders/${omnikassaOrderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Request-ID': randomUUID(),
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`Rabo getOrderStatus failed: ${response.status} ${text.slice(0, 300)}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

// ── Status Mapping ─────────────────────────────────────────────────────

/**
 * Map Rabo Smart Pay orderStatus to our internal status.
 *
 * Rabo statuses:
 *   IN_PROGRESS → pending
 *   COMPLETED   → paid (if paidAmount matches totalAmount)
 *   CANCELLED   → failed
 *   EXPIRED     → expired
 *
 * Transaction statuses (for paymentMethodUsed):
 *   SUCCESS, CANCELLED, EXPIRED, FAILURE, OPEN, NEW, ACCEPTED
 */
export function mapRaboOrderStatus(
    result: RaboMerchantOrderResult
): { status: OurPaymentStatus; paymentMethodUsed: string | null } {
    const paymentMethodUsed = result.transactions && result.transactions.length > 0
        ? result.transactions[0].paymentBrand
        : null;

    switch (result.orderStatus) {
        case 'COMPLETED':
            return { status: 'paid', paymentMethodUsed };

        case 'CANCELLED':
            return { status: 'failed', paymentMethodUsed: null };

        case 'EXPIRED':
            return { status: 'expired', paymentMethodUsed: null };

        case 'IN_PROGRESS':
            return { status: 'pending', paymentMethodUsed: null };

        default:
            console.error('Unknown Rabo order status:', result.orderStatus);
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
