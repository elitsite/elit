-- ================================================================
-- Elite Bloemen — CANONICAL DATABASE SCHEMA
-- Single source of truth. Run this on a fresh Supabase project.
--
-- Languages: base column = EN; suffixed columns = _uk (Ukrainian), _nl (Dutch).
-- Currency: EUR (integer amounts).
--
-- Execution order (all idempotent — safe to re-run):
--   1. Extensions
--   2. Tables (CREATE TABLE IF NOT EXISTS)
--   3. Columns (ALTER TABLE ADD COLUMN IF NOT EXISTS)
--   4. Indexes
--   5. RLS Policies
--   6. Storage bucket
--   7. RPC functions (+ security restrictions)
--   8. Default data seed
--   9. Schema cache reload
-- ================================================================


-- ================================================================
-- § 1  EXTENSIONS
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ================================================================
-- § 2  TABLES
-- ================================================================

-- ── bouquets (products) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bouquets (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT        NOT NULL,
    description     TEXT        DEFAULT '',
    price           INTEGER     NOT NULL DEFAULT 0,
    discount        INTEGER     NOT NULL DEFAULT 0,
    image_url       TEXT        DEFAULT '',
    in_stock        BOOLEAN     NOT NULL DEFAULT true,
    category        TEXT        DEFAULT 'mono-bouquets',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Structured description fields
    composition     TEXT,
    kit_info        TEXT,
    important_note  TEXT,
    extra_images    JSONB       DEFAULT '[]',
    -- Multilingual: EN = base column; suffixed = translations
    name_uk         TEXT,
    name_nl         TEXT,
    description_uk  TEXT,
    description_nl  TEXT,
    composition_uk  TEXT,
    composition_nl  TEXT,
    kit_info_uk     TEXT,
    kit_info_nl     TEXT,
    important_note_uk TEXT,
    important_note_nl TEXT
);

COMMENT ON TABLE  public.bouquets          IS 'Flower shop products';
COMMENT ON COLUMN public.bouquets.category IS 'Leaf category slug (hierarchy defined in code: src/lib/categories.ts). E.g. mono-bouquets, mixed-bouquets, author-bouquets, premium-bouquets, mini-bouquets, box-arrangements, basket-arrangements, table-arrangements, interior-arrangements, bridal-bouquet, boutonnieres, hall-table-decor, floral-arches, funeral-arrangement, funeral-bouquet, funeral-ribbon, funeral-decor, wedding-portfolio, wedding-packages, wedding-decor, party-portfolio, party-packages, party-decor';
COMMENT ON COLUMN public.bouquets.discount IS 'Discount percent 0-100. Effective price = price * (1 - discount/100)';


-- ── orders ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name   TEXT        NOT NULL,
    customer_phone  TEXT        NOT NULL,
    product_id      TEXT,
    product_name    TEXT,
    product_price   INTEGER,
    delivery_type   TEXT,
    address         TEXT,
    time_type       TEXT,
    specific_time   TEXT,
    comment         TEXT,
    order_type      TEXT        DEFAULT 'bouquet',
    status          TEXT        NOT NULL DEFAULT 'new',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.orders        IS 'Customer orders — written by service_role only';
COMMENT ON COLUMN public.orders.status IS 'Order lifecycle: new → confirmed → completed | cancelled';

-- Cart support
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_subtotal INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.orders.items IS 'Cart items array: [{id, name, price, quantity, finalPrice}]. NULL for single-product orders.';
COMMENT ON COLUMN public.orders.consent_at IS 'Server-side timestamp when user consent was recorded.';
COMMENT ON COLUMN public.orders.delivery_fee IS 'Delivery fee in EUR (integer). 0 for pickup.';
COMMENT ON COLUMN public.orders.items_subtotal IS 'Sum of items (finalPrice × qty) before delivery. NULL for legacy orders.';

-- Optional payment columns (reserved for a future payment provider).
-- Currently UNUSED by the app (orders are placed without online payment).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_error TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method_used TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_started_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_redirect_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.orders.payment_status IS 'Reserved for future payment provider: pending | paid | failed | expired. NULL = no online payment.';


-- ── settings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
    id                      TEXT    PRIMARY KEY DEFAULT 'main',
    -- Shop state
    shop_open               BOOLEAN NOT NULL DEFAULT true,
    delivery_enabled        BOOLEAN NOT NULL DEFAULT true,
    -- Branding (shop_name is NOT translated)
    shop_name               TEXT    DEFAULT 'Elite Bloemen',
    hero_title              TEXT    DEFAULT 'Elite Bloemen',
    hero_subtitle           TEXT    DEFAULT 'Fresh bouquets for special moments',
    -- Contact info
    phone                   TEXT    DEFAULT '',
    telegram_link           TEXT    DEFAULT '',
    address                 TEXT    DEFAULT '',
    address_link            TEXT    DEFAULT '',
    schedule                TEXT    DEFAULT '',
    -- Social links
    instagram_link          TEXT    DEFAULT '',
    facebook_link           TEXT    DEFAULT '',
    whatsapp_link           TEXT    DEFAULT '',
    google_maps_embed       TEXT    DEFAULT '',
    -- Content sections with toggles
    about_enabled           BOOLEAN DEFAULT false,
    about_text              TEXT    DEFAULT '',
    schedule_enabled        BOOLEAN DEFAULT false,
    delivery_price_enabled  BOOLEAN DEFAULT false,
    delivery_price          TEXT    DEFAULT '',
    delivery_info           TEXT    DEFAULT '',
    pickup_info             TEXT    DEFAULT '',
    payment_info            TEXT    DEFAULT '',
    -- Per-day schedule
    sched_mon               TEXT    DEFAULT '09:00–18:00',
    sched_mon_open          BOOLEAN DEFAULT true,
    sched_tue               TEXT    DEFAULT '09:00–18:00',
    sched_tue_open          BOOLEAN DEFAULT true,
    sched_wed               TEXT    DEFAULT '09:00–18:00',
    sched_wed_open          BOOLEAN DEFAULT true,
    sched_thu               TEXT    DEFAULT '09:00–18:00',
    sched_thu_open          BOOLEAN DEFAULT true,
    sched_fri               TEXT    DEFAULT '09:00–18:00',
    sched_fri_open          BOOLEAN DEFAULT true,
    sched_sat               TEXT    DEFAULT '10:00–16:00',
    sched_sat_open          BOOLEAN DEFAULT true,
    sched_sun               TEXT    DEFAULT '',
    sched_sun_open          BOOLEAN DEFAULT false,
    -- Translations of content fields (EN = base; suffixed = translated)
    hero_title_uk           TEXT,   hero_title_nl           TEXT,
    hero_subtitle_uk        TEXT,   hero_subtitle_nl        TEXT,
    about_text_uk           TEXT,   about_text_nl           TEXT,
    delivery_info_uk        TEXT,   delivery_info_nl        TEXT,
    pickup_info_uk          TEXT,   pickup_info_nl          TEXT,
    payment_info_uk         TEXT,   payment_info_nl         TEXT,
    schedule_uk             TEXT,   schedule_nl             TEXT,
    address_uk              TEXT,   address_nl              TEXT,
    -- Dynamic price filters (EUR)
    price_filters           JSONB   DEFAULT '[{"min":0,"max":25},{"min":0,"max":50},{"min":0,"max":75},{"min":0,"max":100},{"min":0,"max":150},{"min":150,"max":null}]'
);

COMMENT ON TABLE public.settings IS 'Single-row shop configuration. Always has exactly one row with id = ''main''.';


-- ================================================================
-- § 3  IDEMPOTENT COLUMN ADDITIONS
--      Safe to run even if columns already exist.
-- ================================================================

-- bouquets additive columns
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS category        TEXT    DEFAULT 'mono-bouquets';
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS composition     TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS kit_info        TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS important_note  TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS extra_images    JSONB   DEFAULT '[]';
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS name_uk         TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS name_nl         TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS description_uk  TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS description_nl  TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS composition_uk  TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS composition_nl  TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS kit_info_uk     TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS kit_info_nl     TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS important_note_uk TEXT;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS important_note_nl TEXT;

-- settings additive columns
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS instagram_link         TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS facebook_link          TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS whatsapp_link          TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS google_maps_embed      TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_mon              TEXT DEFAULT '09:00–18:00';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_mon_open         BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_tue              TEXT DEFAULT '09:00–18:00';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_tue_open         BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_wed              TEXT DEFAULT '09:00–18:00';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_wed_open         BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_thu              TEXT DEFAULT '09:00–18:00';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_thu_open         BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_fri              TEXT DEFAULT '09:00–18:00';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_fri_open         BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_sat              TEXT DEFAULT '10:00–16:00';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_sat_open         BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_sun              TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sched_sun_open         BOOLEAN DEFAULT false;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_title_uk          TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_title_nl          TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_subtitle_uk       TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_subtitle_nl       TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS about_text_uk          TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS about_text_nl          TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_info_uk       TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_info_nl       TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pickup_info_uk         TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS pickup_info_nl         TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_info_uk        TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_info_nl        TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS schedule_uk            TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS schedule_nl            TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS address_uk             TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS address_nl             TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS price_filters          JSONB DEFAULT '[{"min":0,"max":25},{"min":0,"max":50},{"min":0,"max":75},{"min":0,"max":100},{"min":0,"max":150},{"min":150,"max":null}]';


-- ================================================================
-- § 4  INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_bouquets_created_at          ON public.bouquets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouquets_category            ON public.bouquets (category);
CREATE INDEX IF NOT EXISTS idx_orders_created_at            ON public.orders   (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone_created_at      ON public.orders   (customer_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at     ON public.orders   (status, created_at DESC);
-- Dedupe index: covers the multi-column filter in /api/cart-order (idempotency check)
CREATE INDEX IF NOT EXISTS idx_orders_dedupe
    ON public.orders (customer_phone, product_id, delivery_type, time_type, order_type, created_at DESC);


-- ================================================================
-- § 5  ROW LEVEL SECURITY
-- ================================================================

-- ── bouquets ────────────────────────────────────────────────────
ALTER TABLE public.bouquets ENABLE ROW LEVEL SECURITY;

-- Public SELECT on the base table (catalog data is public by nature).
-- Writes remain service_role-only (policy below).
DROP POLICY IF EXISTS "Public can read bouquets"       ON public.bouquets;
CREATE POLICY "Public can read bouquets"
    ON public.bouquets FOR SELECT
    TO anon, authenticated
    USING (true);
GRANT SELECT ON public.bouquets TO anon, authenticated;

DROP POLICY IF EXISTS "Service role manages bouquets"  ON public.bouquets;
CREATE POLICY "Service role manages bouquets"
    ON public.bouquets FOR ALL
    USING (auth.role() = 'service_role');


-- ── orders ──────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Remove any old insecure policy that allowed anon to insert directly
DROP POLICY IF EXISTS "Public can insert orders"       ON public.orders;

DROP POLICY IF EXISTS "Only API can insert orders"     ON public.orders;
CREATE POLICY "Only API can insert orders"
    ON public.orders FOR INSERT
    TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages orders"    ON public.orders;
CREATE POLICY "Service role manages orders"
    ON public.orders FOR ALL
    USING (auth.role() = 'service_role');


-- ── settings ────────────────────────────────────────────────────
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Public SELECT on the base table (shop settings are displayed on the site).
-- WARNING: do not store secrets in this table — anon can read every column.
DROP POLICY IF EXISTS "Public can read settings"       ON public.settings;
CREATE POLICY "Public can read settings"
    ON public.settings FOR SELECT
    TO anon, authenticated
    USING (true);
GRANT SELECT ON public.settings TO anon, authenticated;

DROP POLICY IF EXISTS "Service role manages settings"  ON public.settings;
CREATE POLICY "Service role manages settings"
    ON public.settings FOR ALL
    USING (auth.role() = 'service_role');


-- ================================================================
-- § 5b  VIEWS (public-facing projections)
-- ================================================================

CREATE OR REPLACE VIEW public.settings_public
WITH (security_invoker = on) AS
SELECT
    -- Shop state
    shop_open, delivery_enabled,
    -- Branding
    shop_name, hero_title, hero_subtitle,
    -- Contact
    phone, telegram_link, address, address_link, schedule,
    -- Social
    instagram_link, facebook_link, whatsapp_link, google_maps_embed,
    -- Content toggles
    about_enabled, about_text, schedule_enabled,
    delivery_price_enabled, delivery_price,
    delivery_info, pickup_info, payment_info,
    -- Per-day schedule
    sched_mon, sched_mon_open, sched_tue, sched_tue_open,
    sched_wed, sched_wed_open, sched_thu, sched_thu_open,
    sched_fri, sched_fri_open, sched_sat, sched_sat_open,
    sched_sun, sched_sun_open,
    -- Translations
    hero_title_uk, hero_title_nl,
    hero_subtitle_uk, hero_subtitle_nl,
    about_text_uk, about_text_nl,
    delivery_info_uk, delivery_info_nl,
    pickup_info_uk, pickup_info_nl,
    payment_info_uk, payment_info_nl,
    schedule_uk, schedule_nl,
    address_uk, address_nl,
    -- Dynamic price filters
    price_filters
FROM public.settings;

GRANT SELECT ON public.settings_public TO anon, authenticated;


CREATE OR REPLACE VIEW public.bouquets_public
WITH (security_invoker = on) AS
SELECT
    id, name, description, price, discount, image_url,
    in_stock, category, created_at,
    composition, kit_info, important_note, extra_images,
    -- Translations
    name_uk, name_nl,
    description_uk, description_nl,
    composition_uk, composition_nl,
    kit_info_uk, kit_info_nl,
    important_note_uk, important_note_nl
FROM public.bouquets;

GRANT SELECT ON public.bouquets_public TO anon, authenticated;


-- ── event_pages (landing page content for weddings / parties) ──
CREATE TABLE IF NOT EXISTS public.event_pages (
    slug        TEXT        PRIMARY KEY,   -- 'weddings' | 'parties'
    content     JSONB       NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.event_pages         IS 'CMS-driven landing pages for event categories (weddings, parties). Content is a structured JSONB blob with localized text fields.';
COMMENT ON COLUMN public.event_pages.content IS 'Structured JSON: hero_image, hero_title{en,uk,nl}, intro, sections[], portfolio[], gallery[], quote, etc.';

-- RLS
ALTER TABLE public.event_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read event_pages" ON public.event_pages;
CREATE POLICY "Public can read event_pages"
    ON public.event_pages FOR SELECT
    TO anon, authenticated
    USING (true);
GRANT SELECT ON public.event_pages TO anon, authenticated;

DROP POLICY IF EXISTS "Service role manages event_pages" ON public.event_pages;
CREATE POLICY "Service role manages event_pages"
    ON public.event_pages FOR ALL
    USING (auth.role() = 'service_role');

-- Public view
CREATE OR REPLACE VIEW public.event_pages_public
WITH (security_invoker = on) AS
SELECT slug, content, updated_at
FROM public.event_pages;

GRANT SELECT ON public.event_pages_public TO anon, authenticated;


-- ================================================================
-- § 6  STORAGE BUCKET
-- ================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('bouquets', 'bouquets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read bouquet images"  ON storage.objects;

DROP POLICY IF EXISTS "Service role manages bouquet images" ON storage.objects;
CREATE POLICY "Service role manages bouquet images"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'bouquets')
    WITH CHECK (bucket_id = 'bouquets');


-- ================================================================
-- § 7  RPC FUNCTIONS
-- ================================================================

-- run_elite_bloemen_migration: idempotent no-op wrapper (kept for legacy runs).
-- SECURITY: Restricted to service_role only — cannot be called via anon key.
CREATE OR REPLACE FUNCTION public.run_elite_bloemen_migration()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- All schema changes are defined in supabase-schema.sql (§ 3).
    RETURN 'OK: schema is up to date (see supabase-schema.sql)';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_elite_bloemen_migration() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.run_elite_bloemen_migration() TO service_role;


-- ================================================================
-- § 8  DEFAULT DATA SEED
-- ================================================================

INSERT INTO public.settings (id, shop_name, hero_title, hero_subtitle)
VALUES ('main', 'Elite Bloemen', 'Elite Bloemen', 'Fresh bouquets for special moments')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_pages (slug, content) VALUES
('weddings', '{"hero_image":"","hero_title":{"en":"","uk":"","nl":""},"hero_subtitle":{"en":"","uk":"","nl":""},"intro_kicker":{"en":"","uk":"","nl":""},"intro_title":{"en":"","uk":"","nl":""},"intro_text":{"en":"","uk":"","nl":""},"intro_button":{"en":"","uk":"","nl":""},"media_image":"","sections":[],"quote_image":"","quote_kicker":{"en":"","uk":"","nl":""},"quote_text":{"en":"","uk":"","nl":""},"quote_author":{"en":"","uk":"","nl":""},"portfolio_kicker":{"en":"","uk":"","nl":""},"portfolio_title":{"en":"","uk":"","nl":""},"portfolio":[],"gallery":[],"form_title":{"en":"","uk":"","nl":""}}'),
('parties', '{"hero_image":"","hero_title":{"en":"","uk":"","nl":""},"hero_subtitle":{"en":"","uk":"","nl":""},"intro_kicker":{"en":"","uk":"","nl":""},"intro_title":{"en":"","uk":"","nl":""},"intro_text":{"en":"","uk":"","nl":""},"intro_button":{"en":"","uk":"","nl":""},"media_image":"","sections":[],"quote_image":"","quote_kicker":{"en":"","uk":"","nl":""},"quote_text":{"en":"","uk":"","nl":""},"quote_author":{"en":"","uk":"","nl":""},"portfolio_kicker":{"en":"","uk":"","nl":""},"portfolio_title":{"en":"","uk":"","nl":""},"portfolio":[],"gallery":[],"form_title":{"en":"","uk":"","nl":""}}')
ON CONFLICT (slug) DO NOTHING;


-- ================================================================
-- § 9  RELOAD SCHEMA CACHE
-- ================================================================

NOTIFY pgrst, 'reload schema';

-- ================================================================
-- END OF SCHEMA
-- ================================================================
