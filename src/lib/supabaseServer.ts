import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with service_role key.
 * This client BYPASSES Row Level Security — use ONLY in API routes.
 * NEVER import this in client-side code or components.
 */

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key').trim();

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
