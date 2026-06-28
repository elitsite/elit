import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with service_role key.
 * This client BYPASSES Row Level Security — use ONLY in API routes.
 * NEVER import this in client-side code or components.
 */

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (process.env.NODE_ENV === 'production' && (!rawUrl || !rawKey)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production');
}

const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseServiceKey = rawKey || 'placeholder_key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
