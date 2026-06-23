import { z } from 'zod';

export const cartOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
    })).min(1).max(20),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().min(10, 'Enter a valid phone number').max(20)
        .regex(/^\+?[\d\s\-]{9,20}$/, 'Invalid phone number format'),
    address: z.string().max(500).optional(),
    deliveryType: z.enum(['delivery', 'pickup']),
    timeType: z.enum(['urgent', 'specific']),
    specificTime: z.string().max(100).optional(),
    comment: z.string().max(1000).optional(),
    consent: z.literal(true, {
        errorMap: () => ({ message: 'Consent is required' }),
    }),
}).refine(
    data => data.deliveryType !== 'delivery' || (data.address && data.address.trim().length > 0),
    { message: 'Address is required for delivery', path: ['address'] }
).refine(
    data => data.timeType !== 'specific' || (data.specificTime && data.specificTime.trim().length > 0),
    { message: 'Time is required when specific time is selected', path: ['specificTime'] }
);

export type CartOrderData = z.infer<typeof cartOrderSchema>;
