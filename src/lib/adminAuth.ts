import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const HEX_32_RE = /^[a-f0-9]{32}$/;
const HEX_64_RE = /^[a-f0-9]{64}$/;

/**
 * Verify admin session token from cookie.
 * Returns true if token is valid (proper HMAC signature and not expired).
 */
export function verifySessionToken(token: string): boolean {
    const SECRET_KEY = process.env.ADMIN_SECRET_KEY || '';
    if (!SECRET_KEY) return false;

    const parts = token.split(':');
    if (parts.length !== 3) return false;

    const [timestamp, random, providedHash] = parts;
    if (!HEX_32_RE.test(random) || !HEX_64_RE.test(providedHash)) return false;

    const ts = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return false;

    const now = Date.now();
    if (ts > now + MAX_FUTURE_SKEW_MS) return false;
    if (now - ts > SESSION_MAX_AGE_MS) {
        return false;
    }

    const data = `${timestamp}:${random}`;
    const expectedHash = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(data)
        .digest('hex');

    try {
        const a = Buffer.from(providedHash, 'hex');
        const b = Buffer.from(expectedHash, 'hex');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

/**
 * Extract and verify admin session from a Request.
 * Uses Next.js cookies() API first, falls back to raw header parsing.
 */
export async function verifyAdminRequest(request: Request): Promise<boolean> {
    // Method 1: Try Next.js cookies() API
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('admin_session');
        if (sessionCookie?.value) {
            return verifySessionToken(sessionCookie.value);
        }
    } catch {
        // Fallback to manual parsing if cookies() fails
    }

    // Method 2: Parse from raw Cookie header
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (!match) return false;
    return verifySessionToken(decodeURIComponent(match[1]));
}
