import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { parseSessionToken, verifyHmacHex } from '@/lib/hmacSession';

const intlMiddleware = createMiddleware(routing);

function applyNoStoreHeaders(response: NextResponse): NextResponse {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
}

function redirectToLogin(request: NextRequest, clearCookie: boolean): NextResponse {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    if (clearCookie) response.cookies.delete('admin_session');
    return applyNoStoreHeaders(response);
}

async function adminMiddleware(request: NextRequest): Promise<NextResponse> {
    if (!request.nextUrl.pathname.startsWith('/admin/login')) {
        const authCookie = request.cookies.get('admin_session');

        if (!authCookie?.value) {
            return redirectToLogin(request, false);
        }

        const parts = parseSessionToken(authCookie.value);
        if (!parts) return redirectToLogin(request, true);

        const SECRET_KEY = process.env.ADMIN_SECRET_KEY || '';
        if (!SECRET_KEY) return redirectToLogin(request, false);

        const isValid = await verifyHmacHex(
            `${parts.timestamp}:${parts.random}`,
            parts.hash,
            SECRET_KEY,
        );
        if (!isValid) return redirectToLogin(request, true);
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
