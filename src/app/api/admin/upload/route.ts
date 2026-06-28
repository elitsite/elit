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

/**
 * Sniff the real image type from the file's magic bytes. Returns the canonical
 * extension, or null if the content does not match a known raster image format.
 * SVG is intentionally NOT supported (it can carry executable script → stored XSS).
 */
function sniffImageExt(buf: Buffer): string | null {
    if (buf.length < 12) return null;
    // JPEG: FF D8 FF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
    // GIF: "GIF8"
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'gif';
    // BMP: "BM"
    if (buf[0] === 0x42 && buf[1] === 0x4d) return 'bmp';
    // TIFF: "II*\0" or "MM\0*"
    if ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a && buf[3] === 0x00) ||
        (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a)) return 'tiff';
    // RIFF....WEBP
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'webp';
    // ISO-BMFF "ftyp" box (bytes 4-7) → AVIF / HEIC / HEIF by brand (bytes 8-11)
    if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
        const brand = buf.toString('ascii', 8, 12);
        if (brand.startsWith('avif') || brand.startsWith('avis')) return 'avif';
        if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('hevc')) return 'heic';
        if (brand.startsWith('mif1') || brand.startsWith('msf1') || brand.startsWith('heif')) return 'heif';
    }
    return null;
}

const EXT_TO_MIME: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    webp: 'image/webp',
    avif: 'image/avif',
    heic: 'image/heic',
    heif: 'image/heif',
};

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

        // Verify the REAL content via magic bytes (don't trust the client MIME).
        // This blocks spoofed/polyglot files and SVG (which sniffs to null).
        const ext = sniffImageExt(buffer);
        if (!ext) {
            return NextResponse.json(
                { error: 'Unsupported or invalid image. Allowed: JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC.' },
                { status: 400, headers: NO_CACHE_HEADERS }
            );
        }
        const contentType = EXT_TO_MIME[ext];

        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
        const filePath = `products/${uniqueName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from(DB_TABLES.BOUQUETS)
            .upload(filePath, buffer, {
                contentType,
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
            return NextResponse.json({ error: 'Upload failed' }, { status: 500, headers: NO_CACHE_HEADERS });
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
