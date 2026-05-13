-- Products catalog (manual + OFF reference).
CREATE TABLE IF NOT EXISTS public.products
(
    id                 uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    barcode            text        NULL,
    name               text        NOT NULL,
    brand              text        NULL,
    category           text        NULL,
    image_url          text        NULL,
    source             text        NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'off', 'ocr')),
    off_code           text        NULL REFERENCES off.products (code) ON DELETE SET NULL,
    data_quality_score integer     NOT NULL DEFAULT 0
        CHECK (data_quality_score BETWEEN 0 AND 100),
    created_by         uuid        NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Unique partial index: two products cannot share the same barcode
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_barcode
    ON public.products (barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_products_off_code
    ON public.products (off_code) WHERE off_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_products_fts
    ON public.products USING gin (to_tsvector('spanish', name));

DROP TRIGGER IF EXISTS trg_touch_products ON public.products;
CREATE TRIGGER trg_touch_products
    BEFORE UPDATE
    ON public.products
    FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.products
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_insert ON public.products;

-- SELECT: all the authenticated users can read the catalog (shared knowledge)
CREATE POLICY products_select ON public.products
    FOR SELECT TO authenticated USING (true);

-- INSERT: the user can only create products they own
CREATE POLICY products_insert ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

GRANT SELECT, INSERT ON public.products TO authenticated;
