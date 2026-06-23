import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { NO_CACHE_HEADERS } from '@/lib/apiUtils';

/**
 * POST /api/admin/migrate
 * Calls the run_elite_bloemen_migration() function via Supabase RPC.
 * The function must exist in Supabase (created via SQL Editor once).
 */
export async function POST(request: Request) {
    // Disable migration endpoint in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const { data, error } = await supabaseAdmin.rpc('run_elite_bloemen_migration');

    if (error) {
        console.error('Migration RPC error:', error.message);
        return NextResponse.json({
            success: false,
            error: 'Migration failed',
        }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({
        success: true,
        result: data,
    }, { headers: NO_CACHE_HEADERS });
}
