import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getClientIp, checkLimitAsync, RateLimitRecord, NO_CACHE_HEADERS } from '@/lib/apiUtils';

// Rate limiting state
const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 5000;

function generateSessionToken(secretKey: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const data = `${timestamp}:${random}`;
    const hash = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
    return `${timestamp}:${random}:${hash}`;
}

export async function POST(request: Request) {
    try {
        const SECRET_KEY = process.env.ADMIN_SECRET_KEY || '';
        const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

        if (!ADMIN_PASSWORD_HASH || !SECRET_KEY) {
            console.error('Missing ADMIN_PASSWORD_HASH or ADMIN_SECRET_KEY env vars');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500, headers: NO_CACHE_HEADERS }
            );
        }

        // Rate limiting
        const ip = getClientIp(request);
        const { allowed, remaining } = await checkLimitAsync(loginAttempts, ip, MAX_ATTEMPTS, WINDOW_MS, MAX_TRACKED_IPS, 'login');

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many attempts. Try again in 15 minutes.' },
                {
                    status: 429,
                    headers: { ...NO_CACHE_HEADERS, 'Retry-After': '900' }
                }
            );
        }

        const { password } = await request.json();
        if (!password || typeof password !== 'string') {
            return NextResponse.json(
                { error: 'Password required' },
                { status: 400, headers: NO_CACHE_HEADERS }
            );
        }
        if (password.length > 256) {
            return NextResponse.json(
                { error: 'Password too long' },
                { status: 400, headers: NO_CACHE_HEADERS }
            );
        }

        // bcryptjs v3 is ESM — use dynamic import
        let isValid = false;
        try {
            const bcryptModule = await import('bcryptjs');
            // Handle both default and named exports (ESM compat)
            const compare = bcryptModule.compare ?? bcryptModule.default?.compare;
            if (compare) {
                isValid = await compare(password, ADMIN_PASSWORD_HASH);
            } else {
                console.error('bcryptjs: compare function not found in module exports');
                return NextResponse.json(
                    { error: 'Server error: bcrypt config' },
                    { status: 500, headers: NO_CACHE_HEADERS }
                );
            }
        } catch (importErr) {
            console.error('bcryptjs import failed:', importErr instanceof Error ? importErr.message : importErr);
            return NextResponse.json(
                { error: 'Server error: bcrypt import' },
                { status: 500, headers: NO_CACHE_HEADERS }
            );
        }

        if (isValid) {
            loginAttempts.delete(ip);
            const sessionToken = generateSessionToken(SECRET_KEY);
            const cookieStore = await cookies();
            cookieStore.set('admin_session', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
                priority: 'high',
            });
            return NextResponse.json(
                { success: true },
                { headers: NO_CACHE_HEADERS }
            );
        }

        return NextResponse.json(
            { error: 'Invalid password', remaining },
            { status: 401, headers: NO_CACHE_HEADERS }
        );
    } catch (err) {
        console.error('Login route error:', err);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
