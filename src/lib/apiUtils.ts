import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

/**
 * Standard No-Cache headers for sensitive API responses.
 */
export const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

/**
 * CSRF protection: verify that the request Origin matches the Host.
 * Returns a 403 response if origin is foreign, or null if OK.
 * Only checks mutating requests (POST/PUT/PATCH/DELETE).
 */
export function assertSameOrigin(request: Request): NextResponse | null {
    const origin = request.headers.get('origin');
    if (!origin) return null; // no origin header = same-origin or non-browser
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

export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for') || '';
    const first = forwarded.split(',')[0]?.trim();
    const realIp = request.headers.get('x-real-ip')?.trim();
    const candidate = first || realIp || 'unknown';

    if (!IP_PATTERN.test(candidate)) return 'unknown';
    return candidate;
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
