import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { assertSameOrigin, checkLimitAsync, getClientIp, NO_CACHE_HEADERS, type RateLimitRecord } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';

const inquiryAttempts = new Map<string, RateLimitRecord>();
const MAX_INQUIRIES = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_IPS = 5000;

const inquirySchema = z.object({
    slug: z.enum(['weddings', 'parties']),
    name: z.string().trim().min(1).max(200),
    phone: z.string().trim().min(7).max(32),
    email: z.string().email().max(200).optional().or(z.literal('')),
    date: z.string().max(50).optional().or(z.literal('')),
    message: z.string().max(2000).optional().or(z.literal('')),
});

export async function POST(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;

    const ip = getClientIp(request);
    const { allowed } = await checkLimitAsync(inquiryAttempts, ip, MAX_INQUIRIES, WINDOW_MS, MAX_TRACKED_IPS, 'event-inquiry');
    if (!allowed) {
        return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429, headers: NO_CACHE_HEADERS });
    }

    try {
        const raw = await request.json();
        const parsed = inquirySchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        const { name, phone, email, date, message, slug } = parsed.data;

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
