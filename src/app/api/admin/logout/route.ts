import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { NO_CACHE_HEADERS, assertSameOrigin } from '@/lib/apiUtils';

export async function POST(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;

    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin_session');
    } catch (e) {
        // Cookie deletion is best-effort — logout should always succeed
        console.error('Logout cookie error:', e);
    }
    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
}
