import { cookies } from 'next/headers';
import { verifySessionTokenHmac } from '@/lib/hmacSession';

/**
 * Verify admin session token from cookie.
 * Returns true if token is valid (proper HMAC signature and not expired).
 *
 * Delegates to the shared {@link verifySessionTokenHmac} so this code path
 * cannot drift from the edge middleware verification.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
    const SECRET_KEY = process.env.ADMIN_SECRET_KEY || '';
    if (!SECRET_KEY) return false;
    return verifySessionTokenHmac(token, SECRET_KEY);
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
            return await verifySessionToken(sessionCookie.value);
        }
    } catch {
        // Fallback to manual parsing if cookies() fails
    }

    // Method 2: Parse from raw Cookie header
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (!match) return false;
    return await verifySessionToken(decodeURIComponent(match[1]));
}
