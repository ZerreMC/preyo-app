-- Catalog and crowdsourced prices: stores, products, price_entries.
-- Backs the /compare feature and the "cheapest price + store" shown in lists.
-- Column shapes match the existing seed (supabase/seed/*.sql).

-- TABLES

-- Stores. Global stores (is_global = true) form the shared catalog; users may
-- also create private stores (created_by = their uid).
CREATE TABLE IF NOT EXISTS public.stores
(
    id          uuid PRIMARY KEY,
    name        text             NOT NULL,
    slug        text             NOT NULL UNIQUE,
    chain       text             NULL,
    address     text             NULL,
    city        text             NULL,
    postal_code text             NULL,
    latitude    double precision NULL,
    longitude   double precision NULL,
    created_by  uuid             NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    is_global   boolean          NOT NULL DEFAULT false,
    created_at  timestamptz      NOT NULL DEFAULT now(),
    updated_at  timestamptz      NOT NULL DEFAULT now()
);

-- Products. Shared catalog; data_quality_score lets crowdsourced data be ranked.
CREATE TABLE IF NOT EXISTS public.products
(
    id                 uuid PRIMARY KEY,
    barcode            text        NULL,
    name               text        NOT NULL,
    brand              text        NULL,
    category           text        NOT NULL,
    image_url          text        NULL,
    source             text        NOT NULL DEFAULT 'manual',
    off_code           text        NULL,
    data_quality_score integer     NULL,
    created_by         uuid        NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Price entries. One observed price of a product at a store, by a user.
CREATE TABLE IF NOT EXISTS public.price_entries
(
    id          uuid PRIMARY KEY,
    product_id  uuid        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
    store_id    uuid        NOT NULL REFERENCES public.stores (id) ON DELETE CASCADE,
    user_id     uuid        NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    price_cents integer     NOT NULL CHECK (price_cents > 0),
    currency    text        NOT NULL DEFAULT 'EUR',
    source      text        NOT NULL DEFAULT 'manual',
    recorded_at date        NOT NULL DEFAULT current_date,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS ix_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS ix_prices_product ON public.price_entries (product_id, price_cents);
CREATE INDEX IF NOT EXISTS ix_prices_store ON public.price_entries (store_id);
-- Latest price per product/store is a frequent lookup for comparison.
CREATE INDEX IF NOT EXISTS ix_prices_product_store_recorded
    ON public.price_entries (product_id, store_id, recorded_at DESC);

-- TRIGGERS (reuse public.touch_updated_at from 0001)
DROP TRIGGER IF EXISTS trg_touch_stores ON public.stores;
CREATE TRIGGER trg_touch_stores
    BEFORE UPDATE
    ON public.stores
    FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_products ON public.products;
CREATE TRIGGER trg_touch_products
    BEFORE UPDATE
    ON public.products
    FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.stores
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_entries
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stores_select ON public.stores;
DROP POLICY IF EXISTS stores_insert_own ON public.stores;
DROP POLICY IF EXISTS stores_update_own ON public.stores;
DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_insert_own ON public.products;
DROP POLICY IF EXISTS products_update_own ON public.products;
DROP POLICY IF EXISTS prices_select ON public.price_entries;
DROP POLICY IF EXISTS prices_insert_own ON public.price_entries;
DROP POLICY IF EXISTS prices_update_own ON public.price_entries;
DROP POLICY IF EXISTS prices_delete_own ON public.price_entries;

-- Stores: global catalog readable by everyone; private stores only by creator.
CREATE POLICY stores_select ON public.stores
    FOR SELECT TO authenticated
    USING (is_global OR created_by = (select auth.uid()));

CREATE POLICY stores_insert_own ON public.stores
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY stores_update_own ON public.stores
    FOR UPDATE TO authenticated
    USING (created_by = (select auth.uid()))
    WITH CHECK (created_by = (select auth.uid()));

-- Products: shared catalog, readable by all authenticated users.
CREATE POLICY products_select ON public.products
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY products_insert_own ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (select auth.uid()) OR created_by IS NULL);

CREATE POLICY products_update_own ON public.products
    FOR UPDATE TO authenticated
    USING (created_by = (select auth.uid()))
    WITH CHECK (created_by = (select auth.uid()));

-- Price entries: crowdsourced, readable by all so comparison works; each user
-- writes only their own rows.
CREATE POLICY prices_select ON public.price_entries
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY prices_insert_own ON public.price_entries
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY prices_update_own ON public.price_entries
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY prices_delete_own ON public.price_entries
    FOR DELETE TO authenticated
    USING (user_id = (select auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.stores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_entries TO authenticated;
