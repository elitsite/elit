-- Section 4.0 — Payment ownership token column
--
-- Adds the access_token column used by /api/payment/status and
-- /api/payment/retry to bind a payment session to the buyer who
-- placed the original order. Tokens are HMAC(PAYMENT_ACCESS_SECRET, orderId)
-- and are written by /api/cart-order at the moment a payment is created.
--
-- Run in Supabase SQL Editor before enabling PAYMENT_ENABLED=true.

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS access_token TEXT;

CREATE INDEX IF NOT EXISTS orders_access_token_idx
    ON orders (access_token)
    WHERE access_token IS NOT NULL;
