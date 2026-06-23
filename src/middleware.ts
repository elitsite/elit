import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const HEX_32_RE = /^[a-f0-9]{32}$/;
const HEX_64_RE = /^[a-f0-9]{64}$/;

const intlMiddleware = createMiddleware(routing);

function applyNoStoreHeaders(response: NextResponse): NextResponse {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
}

// Edge-compatible HMAC verification (Web Crypto).
async function verifyHmac(data: string, providedHash: string, secretKey: string): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secretKey),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
        const expectedHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        if (expectedHex.length !== providedHash.length) return false;
        let diff = 0;
        for (let i = 0; i < expectedHex.length; i++) {
            diff |= expectedHex.charCodeAt(i) ^ providedHash.charCodeAt(i);
        }
        return diff === 0;
    } catch {
        return false;
    }
}

async function adminMiddleware(request: NextRequest): Promise<NextResponse> {
    if (!request.nextUrl.pathname.startsWith('/admin/login')) {
        const authCookie = request.cookies.get('admin_session');

        if (!authCookie || !authCookie.value || authCookie.value.length < 20) {
            return applyNoStoreHeaders(NextResponse.redirect(new URL('/admin/login', request.url)));
        }

        const parts = authCookie.value.split(':');
        if (parts.length !== 3) {
            return applyNoStoreHeaders(NextResponse.redirect(new URL('/admin/login', request.url)));
        }

        const [timestamp, random, providedHash] = parts;
        if (!HEX_32_RE.test(random) || !HEX_64_RE.test(providedHash)) {
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('admin_session');
            return applyNoStoreHeaders(response);
        }

        const ts = Number.parseInt(timestamp, 10);
        const now = Date.now();
        if (!Number.isFinite(ts) || ts > now + MAX_FUTURE_SKEW_MS || now - ts > SESSION_MAX_AGE_MS) {
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('admin_session');
            return applyNoStoreHeaders(response);
        }

        const SECRET_KEY = process.env.ADMIN_SECRET_KEY || '';
        if (!SECRET_KEY) {
            return applyNoStoreHeaders(NextResponse.redirect(new URL('/admin/login', request.url)));
        }

        const isValid = await verifyHmac(`${timestamp}:${random}`, providedHash, SECRET_KEY);
        if (!isValid) {
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('admin_session');
            return applyNoStoreHeaders(response);
        }
    }

    return applyNoStoreHeaders(NextResponse.next());
}

export default async function middleware(request: NextRequest) {
    // Admin area: HMAC session check (not localized).
    if (request.nextUrl.pathname.startsWith('/admin')) {
        return adminMiddleware(request);
    }
    // Public site: next-intl locale routing.
    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except:
    // - /api (route handlers)
    // - Next.js internals (_next, _vercel)
    // - files with an extension (e.g. favicon.ico)
    matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
