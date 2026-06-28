import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { NO_CACHE_HEADERS, assertSameOrigin, errorMessage } from '@/lib/apiUtils';
import { z } from 'zod';
import { DB_TABLES } from '@/lib/constants';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sizeSchema = z.array(z.object({
    size: z.string(),
    price: z.number(),
    details: z.string().optional().nullable()
})).optional().nullable();

const productSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().default(''),
    price: z.number().int().positive().max(9999999),
    discount: z.number().int().min(0).max(100).optional().default(0),
    image_url: z.string().max(5000).optional().default(''),
    in_stock: z.boolean().optional().default(true),
    category: z.string().max(50).optional().default('mono-bouquets'),
    composition: z.string().max(2000).optional().nullable(),
    kit_info: z.string().max(2000).optional().nullable(),
    important_note: z.string().max(2000).optional().nullable(),
    extra_images: z.array(z.string()).optional().nullable(),
    sizes: sizeSchema,
    sizes_uk: sizeSchema,
    sizes_nl: sizeSchema,
    name_uk: z.string().max(200).optional().nullable(),
    name_nl: z.string().max(200).optional().nullable(),
    description_uk: z.string().max(1000).optional().nullable(),
    description_nl: z.string().max(1000).optional().nullable(),
    composition_nl: z.string().max(2000).optional().nullable(),
    composition_uk: z.string().max(2000).optional().nullable(),
    kit_info_nl: z.string().max(2000).optional().nullable(),
    kit_info_uk: z.string().max(2000).optional().nullable(),
    important_note_nl: z.string().max(2000).optional().nullable(),
    important_note_uk: z.string().max(2000).optional().nullable(),
});

type ProductInput = z.infer<typeof productSchema>;

function cleanData<T extends Record<string, unknown>>(validated: T): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(validated)) {
        if (value !== undefined) (result as Record<string, unknown>)[key] = value;
    }
    return result;
}


/**
 * Extract storage path from a Supabase public URL and delete the file.
 * Example URL: https://xxx.supabase.co/storage/v1/object/public/bouquets/products/1234-abc.jpg
 * Extracted path: products/1234-abc.jpg
 */
async function deleteStorageImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;
    try {
        const marker = `/storage/v1/object/public/${DB_TABLES.BOUQUETS}/`;
        const idx = imageUrl.indexOf(marker);
        if (idx === -1) return; // not a Supabase storage URL
        const storagePath = imageUrl.substring(idx + marker.length);
        if (!storagePath || storagePath.includes('..')) return; // safety
        await supabaseAdmin.storage.from(DB_TABLES.BOUQUETS).remove([storagePath]);
    } catch (err) {
        console.error('Failed to delete storage image:', err);
        // Non-blocking: image cleanup failure should not break the main operation
    }
}

async function deleteMultipleImages(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.filter(Boolean).map(url => deleteStorageImage(url)));
}

// Explicit column whitelist (avoids leaking unrelated DB columns to admin UI).
const PRODUCT_COLUMNS = `
    id, name, description, price, discount, image_url, in_stock,
    category, created_at, extra_images,
    sizes, sizes_uk, sizes_nl,
    name_uk, name_nl, description_uk, description_nl,
    composition, composition_uk, composition_nl,
    kit_info, kit_info_uk, kit_info_nl,
    important_note, important_note_uk, important_note_nl
`;

// GET
export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }
    const { data, error } = await supabaseAdmin
        .from(DB_TABLES.BOUQUETS).select(PRODUCT_COLUMNS).order('created_at', { ascending: false }).limit(500);
    if (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}

// POST
export async function POST(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }
    try {
        const body = await request.json();
        const validated: ProductInput = productSchema.parse(body);
        const { data, error } = await supabaseAdmin
            .from(DB_TABLES.BOUQUETS).insert(cleanData(validated)).select().single();
        if (error) throw error;
        revalidatePath('/');
        revalidatePath('/', 'layout');
        return NextResponse.json(data, { status: 201, headers: NO_CACHE_HEADERS });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        const message = errorMessage(err);
        console.error('Products POST error:', message);
        return NextResponse.json({ error: 'Failed to create product', detail: message }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}

// PUT
export async function PUT(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }
    try {
        const body = await request.json();
        const { id, ...rest } = body;
        if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        const validated: ProductInput = productSchema.parse(rest);

        // Fetch old product to compare images
        const { data: oldProduct } = await supabaseAdmin
            .from(DB_TABLES.BOUQUETS).select('image_url, extra_images').eq('id', id).single();

        const { data, error } = await supabaseAdmin
            .from(DB_TABLES.BOUQUETS).update(cleanData(validated)).eq('id', id).select().single();
        if (error) throw error;

        // Clean up old images that were replaced (fire-and-forget)
        if (oldProduct) {
            // Main image changed
            if (oldProduct.image_url && validated.image_url && oldProduct.image_url !== validated.image_url) {
                deleteStorageImage(oldProduct.image_url).catch(() => {});
            }
            // Extra images: delete any that were removed
            const oldExtras: string[] = oldProduct.extra_images || [];
            const newExtras: string[] = validated.extra_images || [];
            const removedExtras = oldExtras.filter((url: string) => !newExtras.includes(url));
            if (removedExtras.length > 0) {
                deleteMultipleImages(removedExtras).catch(() => {});
            }
        }

        revalidatePath('/');
        revalidatePath('/', 'layout');
        revalidatePath('/category/[[...slug]]', 'page');
        return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        if (err instanceof z.ZodError) {
            console.error('Products PUT Zod error:', JSON.stringify(err.errors, null, 2));
            return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        console.error('Products PUT error:', errorMessage(err));
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}

// DELETE
export async function DELETE(request: Request) {
    const csrfBlock = assertSameOrigin(request);
    if (csrfBlock) return csrfBlock;
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id || !UUID_RE.test(id)) return NextResponse.json({ error: 'Product ID required' }, { status: 400, headers: NO_CACHE_HEADERS });

        // Fetch product to get image URLs before deletion
        const { data: product } = await supabaseAdmin
            .from(DB_TABLES.BOUQUETS).select('image_url, extra_images').eq('id', id).single();

        const { error } = await supabaseAdmin.from(DB_TABLES.BOUQUETS).delete().eq('id', id);
        if (error) throw error;

        // Clean up all images from Storage (fire-and-forget)
        if (product) {
            const allImages = [product.image_url, ...(product.extra_images || [])].filter(Boolean);
            if (allImages.length > 0) {
                deleteMultipleImages(allImages).catch(() => {});
            }
        }

        revalidatePath('/');
        revalidatePath('/', 'layout');
    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    } catch (err) {
        console.error('Products DELETE error:', errorMessage(err));
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}
