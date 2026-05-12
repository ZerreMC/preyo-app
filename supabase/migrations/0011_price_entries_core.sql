-- Registros de precio: núcleo del comparador.
-- price_cents: siempre en céntimos para evitar errores de coma flotante.
-- source: trazabilidad legal requerida por ODbL cuando los datos vienen de OFF.
CREATE TABLE IF NOT EXISTS public.price_entries
(
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id    uuid        NOT NULL REFERENCES public.stores(id)   ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
    price_cents integer     NOT NULL CHECK (price_cents >= 0),
    currency    text        NOT NULL DEFAULT 'EUR'
                            CHECK (currency ~ '^[A-Z]{3}$'),
    source      text        NOT NULL DEFAULT 'manual'
                            CHECK (source IN ('manual', 'ocr', 'scraping')),
    recorded_at date        NOT NULL DEFAULT current_date,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_price_entries_product     ON public.price_entries (product_id);
CREATE INDEX IF NOT EXISTS ix_price_entries_store       ON public.price_entries (store_id);
CREATE INDEX IF NOT EXISTS ix_price_entries_user        ON public.price_entries (user_id);
CREATE INDEX IF NOT EXISTS ix_price_entries_recorded    ON public.price_entries (recorded_at DESC);
-- Patrón principal del comparador: precio de un producto en todas las tiendas
CREATE INDEX IF NOT EXISTS ix_price_entries_product_store
    ON public.price_entries (product_id, store_id, recorded_at DESC);

ALTER TABLE public.price_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS price_entries_select ON public.price_entries;
DROP POLICY IF EXISTS price_entries_insert ON public.price_entries;
DROP POLICY IF EXISTS price_entries_delete ON public.price_entries;

-- SELECT: todos los autenticados leen el historial (base del comparador colaborativo)
CREATE POLICY price_entries_select ON public.price_entries
    FOR SELECT TO authenticated USING (true);

-- INSERT: cada usuario registra sus propias observaciones
CREATE POLICY price_entries_insert ON public.price_entries
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- DELETE: solo las propias
CREATE POLICY price_entries_delete ON public.price_entries
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.price_entries TO authenticated;
