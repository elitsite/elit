import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { assertSameOrigin, checkLimitAsync, getClientIp, NO_CACHE_HEADERS, type RateLimitRecord } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';

const inquiryAttempts = new Map<string, RateLimitRecord>();
const MAX_INQUIRIES = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_IPS = 5000;

export async function POST(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;

    const ip = getClientIp(request);
    const { allowed } = await checkLimitAsync(inquiryAttempts, ip, MAX_INQUIRIES, WINDOW_MS, MAX_TRACKED_IPS, 'event-inquiry');
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: NO_CACHE_HEADERS });
    }

    try {
        const body = await request.json();
        const { name, phone, email, date, message, slug } = body as {
            name?: string; phone?: string; email?: string; date?: string; message?: string; slug?: string;
        };

        if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 200) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length === 0 || phone.length > 32) {
            return NextResponse.json({ error: 'Phone is required' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        if (slug !== 'weddings' && slug !== 'parties') {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        const comment = [
            email ? `Email: ${email}` : '',
            date ? `Date: ${date}` : '',
            message ? `Message: ${message}` : '',
            `Event type: ${slug}`,
        ].filter(Boolean).join('\n');

        const { error } = await supabaseAdmin
            .from(DB_TABLES.ORDERS)
            .insert({
                customer_name: name.trim(),
                customer_phone: phone.trim(),
                order_type: 'event',
                product_name: slug === 'weddings' ? 'Wedding inquiry' : 'Party inquiry',
                product_price: 0,
                status: 'new',
                comment,
            });

        if (error) throw error;

        // Telegram notification (best-effort)
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (token && chatId) {
            const lines = [
                '🎉 New event inquiry',
                `👤 ${name}`,
                `📞 ${phone}`,
                email ? `✉️ ${email}` : '',
                date ? `📅 ${date}` : '',
                `🏷️ ${slug}`,
                message ? `💬 ${message}` : '',
            ].filter(Boolean);
            try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), disable_web_page_preview: true }),
                    signal: AbortSignal.timeout(5000),
                });
            } catch { /* no-op */ }
        }

        return NextResponse.json({ ok: true }, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        console.error('Event inquiry error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ error: 'Failed to submit' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
