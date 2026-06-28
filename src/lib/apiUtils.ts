import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';

/**
 * Standard No-Cache headers for sensitive API responses.
 */
export const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

/** Normalize any thrown value to a string message. */
export function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

/**
 * CSRF protection: verify that the request Origin matches the Host.
 * Returns a 403 response if origin is foreign or missing, null if OK.
 * Used on mutating endpoints (POST/PUT/PATCH/DELETE) — browsers always send
 * Origin on these, so a missing header indicates a non-browser client.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
    const origin = request.headers.get('origin');
    if (!origin) {
        // Browsers always send Origin on mutating requests. Missing = curl/bot/SSRF.
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_CACHE_HEADERS });
    }
    const host = request.headers.get('host');
    try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_CACHE_HEADERS });
        }
    } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: NO_CACHE_HEADERS });
    }
    return null;
}

/**
 * Common IP Detection Pattern for rate limiting.
 */
const IP_PATTERN = /^[a-zA-Z0-9:.\-]{1,64}$/;

/**
 * Resolve the client IP from trusted edge headers, preferring those set by
 * the outermost reverse proxy. Spoofable client-supplied `x-forwarded-for`
 * is used only as last resort and only its rightmost (proxy-set) entry.
 */
export function getClientIp(request: Request): string {
    // Vercel normalizes this from the real client edge connection
    const vercel = request.headers.get('x-vercel-forwarded-for');
    if (vercel) {
        const c = vercel.split(',')[0]?.trim();
        if (c && IP_PATTERN.test(c)) return c;
    }

    // Cloudflare
    const cf = request.headers.get('cf-connecting-ip')?.trim();
    if (cf && IP_PATTERN.test(cf)) return cf;

    // Standard reverse proxy (single trusted hop)
    const real = request.headers.get('x-real-ip')?.trim();
    if (real && IP_PATTERN.test(real)) return real;

    // X-Forwarded-For: take the LAST entry (set by outermost trusted proxy);
    // client-controlled entries are prepended and must not be trusted.
    const xff = request.headers.get('x-forwarded-for');
    if (xff) {
        const parts = xff.split(',');
        const last = parts[parts.length - 1]?.trim();
        if (last && IP_PATTERN.test(last)) return last;
    }
    return 'unknown';
}

// ── Upstash Redis rate limiting (works on Vercel serverless) ──────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

let redis: Redis | null = null;
if (useUpstash) {
    redis = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });
}

// Pre-configured rate limiters for different endpoints
const rateLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(prefix: string, maxAttempts: number, windowSec: number): Ratelimit {
    const key = `${prefix}:${maxAttempts}:${windowSec}`;
    if (!rateLimiters.has(key)) {
        rateLimiters.set(key, new Ratelimit({
            redis: redis!,
            limiter: Ratelimit.slidingWindow(maxAttempts, `${windowSec} s`),
            prefix: `alya-bloemen:${prefix}`,
            analytics: false,
        }));
    }
    return rateLimiters.get(key)!;
}

// ── In-memory fallback (for local dev without Upstash) ───────────────

export interface RateLimitRecord {
    count: number;
    resetTime: number;
}

function cleanupStore(store: Map<string, RateLimitRecord>, now: number, maxTracked: number) {
    for (const [key, value] of Array.from(store.entries())) {
        if (now > value.resetTime) {
            store.delete(key);
        }
    }

    if (store.size > maxTracked) {
        const overflow = store.size - maxTracked;
        let removed = 0;
        for (const key of Array.from(store.keys())) {
            store.delete(key);
            removed++;
            if (removed >= overflow) break;
        }
    }
}

function checkLimitInMemory(
    store: Map<string, RateLimitRecord>,
    ip: string,
    maxAttempts: number,
    windowMs: number,
    maxTracked: number
): { allowed: boolean; remaining: number } {
    const now = Date.now();
    cleanupStore(store, now, maxTracked);

    const record = store.get(ip);
    if (!record || now > record.resetTime) {
        store.set(ip, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (record.count >= maxAttempts) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: maxAttempts - record.count };
}

// ── Unified rate limit function ──────────────────────────────────────

/**
 * Check rate limit for an IP. Uses Upstash Redis on Vercel (serverless),
 * falls back to in-memory Map for local development.
 *
 * @param store    In-memory Map (used only as fallback)
 * @param ip       Client IP
 * @param maxAttempts  Max requests allowed in window
 * @param windowMs     Window duration in milliseconds
 * @param maxTracked   Max tracked IPs (in-memory only)
 * @param prefix       Redis key prefix (e.g. 'login', 'order')
 */
export async function checkLimitAsync(
    store: Map<string, RateLimitRecord>,
    ip: string,
    maxAttempts: number,
    windowMs: number,
    maxTracked: number,
    prefix: string = 'default'
): Promise<{ allowed: boolean; remaining: number }> {
    if (useUpstash) {
        try {
            const windowSec = Math.ceil(windowMs / 1000);
            const limiter = getUpstashLimiter(prefix, maxAttempts, windowSec);
            const result = await limiter.limit(ip);
            return { allowed: result.success, remaining: result.remaining };
        } catch (err) {
            console.error('Upstash rate limit error, falling back to in-memory:', err);
            // Fall through to in-memory
        }
    }

    return checkLimitInMemory(store, ip, maxAttempts, windowMs, maxTracked);
}

/**
 * Synchronous rate limit check (in-memory only).
 * Kept for backward compatibility. Prefer checkLimitAsync for new code.
 */
export function checkLimit(
    store: Map<string, RateLimitRecord>,
    ip: string,
    maxAttempts: number,
    windowMs: number,
    maxTracked: number
): { allowed: boolean; remaining: number } {
    return checkLimitInMemory(store, ip, maxAttempts, windowMs, maxTracked);
}

/**
 * Combined admin route guard: CSRF check + session verification +
 * optional in-memory / Upstash rate limiting.
 * Returns a NextResponse to short-circuit on failure, or null when the
 * request may proceed.
 *
 * Usage:
 *   const block = await guardAdmin(request, { store, max: 20, windowMs, maxTracked: 5000, prefix: 'upload' });
 *   if (block) return block;
 */
export async function guardAdmin(
    request: Request,
    opts?: {
        store: Map<string, RateLimitRecord>;
        max: number;
        windowMs: number;
        maxTracked: number;
        prefix: string;
    }
): Promise<NextResponse | null> {
    const csrf = assertSameOrigin(request);
    if (csrf) return csrf;

    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    if (opts) {
        const ip = getClientIp(request);
        const { allowed } = await checkLimitAsync(
            opts.store, ip, opts.max, opts.windowMs, opts.maxTracked, opts.prefix
        );
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Try again later.' },
                { status: 429, headers: NO_CACHE_HEADERS }
            );
        }
    }

    return null;
}
