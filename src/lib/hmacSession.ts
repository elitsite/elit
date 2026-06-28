/**
 * Shared HMAC session verification used by both the Node API runtime
 * (`adminAuth.ts`) and the Edge middleware (`middleware.ts`).
 *
 * Implemented with the Web Crypto API (`crypto.subtle`) which is available
 * in both environments — this removes the prior duplication of two parallel
 * implementations that could drift from each other.
 */

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
export const HEX_32_RE = /^[a-f0-9]{32}$/;
export const HEX_64_RE = /^[a-f0-9]{64}$/;

/**
 * Edge-compatible HMAC-SHA256 verification with constant-time comparison.
 * Returns false on any error or shape mismatch.
 */
export async function verifyHmacHex(
    data: string,
    providedHex: string,
    secret: string,
): Promise<boolean> {
    try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            enc.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign'],
        );
        const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
        const expected = Array.from(new Uint8Array(sig))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        if (expected.length !== providedHex.length) return false;
        let diff = 0;
        for (let i = 0; i < expected.length; i++) {
            diff |= expected.charCodeAt(i) ^ providedHex.charCodeAt(i);
        }
        return diff === 0;
    } catch {
        return false;
    }
}

export interface SessionParts {
    timestamp: string;
    random: string;
    hash: string;
}

/**
 * Validate the structural shape and freshness of a `timestamp:random:hash`
 * session token. Does NOT verify the HMAC signature — call `verifyHmacHex`
 * on `${timestamp}:${random}` for that.
 */
export function parseSessionToken(token: string): SessionParts | null {
    if (!token || token.length < 20) return null;
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    const [timestamp, random, hash] = parts;
    if (!HEX_32_RE.test(random) || !HEX_64_RE.test(hash)) return null;
    const ts = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return null;
    const now = Date.now();
    if (ts > now + MAX_FUTURE_SKEW_MS) return null;
    if (now - ts > SESSION_MAX_AGE_MS) return null;
    return { timestamp, random, hash };
}

/**
 * One-shot helper: parse + verify the full token using the supplied secret.
 */
export async function verifySessionTokenHmac(
    token: string,
    secret: string,
): Promise<boolean> {
    if (!secret) return false;
    const parts = parseSessionToken(token);
    if (!parts) return false;
    return verifyHmacHex(`${parts.timestamp}:${parts.random}`, parts.hash, secret);
}
