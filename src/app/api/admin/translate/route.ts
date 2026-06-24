import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { NO_CACHE_HEADERS, assertSameOrigin, getClientIp, checkLimitAsync, type RateLimitRecord } from '@/lib/apiUtils';

const translateAttempts = new Map<string, RateLimitRecord>();
const MAX_TRANSLATES = 10;
const TRANSLATE_WINDOW_MS = 5 * 60 * 1000;
const MAX_TRACKED_IPS = 5000;

/**
 * POST /api/admin/translate
 * Auto-translate text fields for products.
 * Uses MyMemory free API (no key required, 5000 words/day).
 *
 * Body: { texts: { key: string, value: string }[] }
 * Response: { translations: { [key]: { en: string, uk: string, nl: string } } }
 */

const TARGET_LANGS = ['en', 'uk', 'nl'];

async function translateText(text: string, from: string, to: string): Promise<string> {
    if (!text || !text.trim()) return '';
    if (from === to) return text;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

        if (!response.ok) return '';

        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            const translated = data.responseData.translatedText;
            // MyMemory sometimes returns the original text in CAPS if it can't translate
            if (translated.toUpperCase() === translated && text.toUpperCase() !== text) {
                return ''; // probably failed
            }
            return translated;
        }
        return '';
    } catch {
        return '';
    }
}

// Detect source language by script. Base content is English; Cyrillic → Ukrainian.
function detectSourceLang(text: string): string {
    if (/[\u0400-\u04FF]/.test(text)) return 'uk';
    return 'en';
}

export async function POST(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    // Rate limit translations
    const ip = getClientIp(request);
    const { allowed } = await checkLimitAsync(translateAttempts, ip, MAX_TRANSLATES, TRANSLATE_WINDOW_MS, MAX_TRACKED_IPS, 'translate');
    if (!allowed) {
        return NextResponse.json({ error: 'Too many translation requests. Try again later.' }, { status: 429, headers: NO_CACHE_HEADERS });
    }

    try {
        const { texts } = await request.json();
        // texts = [{ key: 'description', value: '10 red roses...' }, ...]

        if (!Array.isArray(texts) || texts.length === 0) {
            return NextResponse.json({ error: 'No texts provided' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        // Limit array size and text length to prevent API quota exhaustion
        if (texts.length > 10) {
            return NextResponse.json({ error: 'Too many texts (max 10)' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        for (const item of texts) {
            if (typeof item.value === 'string' && item.value.length > 2000) {
                return NextResponse.json({ error: `Text "${item.key}" too long (max 2000 chars)` }, { status: 400, headers: NO_CACHE_HEADERS });
            }
        }

        const results: Record<string, Record<string, string>> = {};

        // Translate every field AND every target language fully in parallel.
        // Previously fields ran sequentially (for...of), which serialized up to
        // 5 external API round-trips and made saving slow.
        await Promise.all(
            texts.map(async ({ key, value }: { key: string; value: string }) => {
                if (!value || !value.trim()) {
                    results[key] = { en: '', uk: '', nl: '' };
                    return;
                }

                const sourceLang = detectSourceLang(value);
                const translations: Record<string, string> = {};

                await Promise.all(
                    TARGET_LANGS.map(async (lang) => {
                        translations[lang] = lang === sourceLang
                            ? value
                            : await translateText(value, sourceLang, lang);
                    }),
                );

                results[key] = translations;
            }),
        );

        return NextResponse.json({ translations: results }, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        console.error('Translation error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
