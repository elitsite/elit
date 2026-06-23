/**
 * Lightweight Telegram notifier for new orders.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars.
 * No-op (resolves) if either is missing — never throws to the caller.
 */

export interface OrderNotification {
    orderId: string;
    customerName: string;
    customerPhone: string;
    itemsSummary: string;
    itemsSubtotal: number;
    deliveryFee: number;
    total: number;
    deliveryType: string;
    address?: string | null;
    timeType?: string | null;
    specificTime?: string | null;
    comment?: string | null;
}

const fmt = (n: number) => `€${(n ?? 0).toLocaleString('nl-NL')}`;

export async function sendOrderTelegram(o: OrderNotification): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    const lines: string[] = [
        '🆕 New order',
        `🆔 ${o.orderId.slice(0, 8)}`,
        '',
        `🛒 ${o.itemsSummary}`,
        `👤 ${o.customerName}`,
        `📞 ${o.customerPhone}`,
    ];

    if (o.deliveryType === 'delivery') {
        lines.push(`🚚 Delivery${o.address ? `: ${o.address}` : ''}`);
    } else {
        lines.push('🏪 Pickup');
    }

    if (o.specificTime) lines.push(`🕐 ${o.specificTime}`);
    else if (o.timeType === 'urgent') lines.push('⚡ ASAP');

    if (o.comment) lines.push(`💬 ${o.comment}`);

    lines.push('');
    if (o.deliveryFee > 0) {
        lines.push(`Items: ${fmt(o.itemsSubtotal)} + Delivery: ${fmt(o.deliveryFee)}`);
    }
    lines.push(`💰 Total: ${fmt(o.total)}`);

    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: lines.join('\n'),
                disable_web_page_preview: true,
            }),
            signal: AbortSignal.timeout(5000),
        });
    } catch (err) {
        console.error('Telegram notify failed:', err instanceof Error ? err.message : err);
    }
}
