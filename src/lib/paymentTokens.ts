import crypto from 'crypto';

/**
 * Payment ownership tokens.
 *
 * Each order gets a deterministic HMAC token derived from PAYMENT_ACCESS_SECRET
 * and the order UUID. The token is included in the gateway return URL and the
 * polling endpoint, so only the buyer who placed the order can read its status
 * or trigger a retry. Tokens are also persisted in `orders.access_token` so we
 * can invalidate a session by clearing that column.
 */

function getSecret(): string {
    const secret = process.env.PAYMENT_ACCESS_SECRET;
    if (!secret || secret.length < 16) {
        throw new Error('PAYMENT_ACCESS_SECRET is required (>= 16 chars)');
    }
    return secret;
}

export function generateAccessToken(orderId: string): string {
    return crypto.createHmac('sha256', getSecret()).update(orderId).digest('hex');
}

export function verifyAccessToken(orderId: string, provided: unknown): boolean {
    if (typeof provided !== 'string' || provided.length === 0) return false;
    let expected: string;
    try {
        expected = generateAccessToken(orderId);
    } catch {
        return false;
    }
    if (expected.length !== provided.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    } catch {
        return false;
    }
}
