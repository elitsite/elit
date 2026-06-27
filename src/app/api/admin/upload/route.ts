import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import crypto from 'crypto';
import { NO_CACHE_HEADERS, assertSameOrigin, getClientIp, checkLimitAsync, type RateLimitRecord } from '@/lib/apiUtils';
import { DB_TABLES } from '@/lib/constants';

const uploadAttempts = new Map<string, RateLimitRecord>();
const MAX_UPLOADS = 20;
const UPLOAD_WINDOW_MS = 5 * 60 * 1000;
const MAX_TRACKED_IPS = 5000;

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB

export async function POST(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    // Rate limit uploads
    const ip = getClientIp(request);
    const { allowed } = await checkLimitAsync(uploadAttempts, ip, MAX_UPLOADS, UPLOAD_WINDOW_MS, MAX_TRACKED_IPS, 'upload');
    if (!allowed) {
        return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429, headers: NO_CACHE_HEADERS });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: NO_CACHE_HEADERS });
        }

        // Only check that it is some kind of image
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Only image files are allowed' },
                { status: 400, headers: NO_CACHE_HEADERS }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400, headers: NO_CACHE_HEADERS }
            );
        }

        // Read file into buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Derive extension from MIME type
        const mimeToExt: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/heic': 'heic',
            'image/heif': 'heif',
            'image/avif': 'avif',
            'image/svg+xml': 'svg',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff',
        };
        const ext = mimeToExt[file.type] || file.type.split('/')[1] || 'img';
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
        const filePath = `products/${uniqueName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from(DB_TABLES.BOUQUETS)
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error('[upload] Supabase Storage error:', {
                message: uploadError.message,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });
            return NextResponse.json({ error: 'Upload failed', detail: uploadError.message }, { status: 500, headers: NO_CACHE_HEADERS });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(DB_TABLES.BOUQUETS)
            .getPublicUrl(filePath);

        return NextResponse.json({
            url: urlData.publicUrl,
            path: filePath,
        }, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        console.error('[upload] Unhandled error:', err instanceof Error ? err.stack || err.message : err);
        return NextResponse.json({ error: 'Server error' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
