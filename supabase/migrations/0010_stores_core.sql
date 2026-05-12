-- Tiendas: globales (seeded) + creadas por usuario.
-- is_global = true  → visibles para todos, solo service_role puede modificar
-- is_global = false → creadas por usuario, solo él puede modificar/borrar
CREATE TABLE IF NOT EXISTS public.stores
(
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text         NOT NULL,
    slug        text         NOT NULL,
    chain       text         NULL,
    address     text         NULL,
    city        text         NULL,
    postal_code text         NULL,
    latitude    numeric(9,6) NULL,
    longitude   numeric(9,6) NULL,
    created_by  uuid         NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    is_global   boolean      NOT NULL DEFAULT false,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_stores_slug ON public.stores (slug);
CREATE INDEX IF NOT EXISTS ix_stores_chain    ON public.stores (chain)     WHERE chain IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_stores_global   ON public.stores (is_global);
CREATE INDEX IF NOT EXISTS ix_stores_city     ON public.stores (city)      WHERE city IS NOT NULL;

DROP TRIGGER IF EXISTS trg_touch_stores ON public.stores;
CREATE TRIGGER trg_touch_stores
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stores_select     ON public.stores;
DROP POLICY IF EXISTS stores_insert_own ON public.stores;
DROP POLICY IF EXISTS stores_update_own ON public.stores;
DROP POLICY IF EXISTS stores_delete_own ON public.stores;

-- SELECT: todos ven todas las tiendas (globales + propias de otros usuarios)
CREATE POLICY stores_select ON public.stores
    FOR SELECT TO authenticated USING (true);

-- INSERT: solo tiendas propias (is_global bloqueado a false por RLS)
CREATE POLICY stores_insert_own ON public.stores
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()) AND is_global = false);

-- UPDATE/DELETE: solo propias y no globales
CREATE POLICY stores_update_own ON public.stores
    FOR UPDATE TO authenticated
    USING     (created_by = (SELECT auth.uid()) AND is_global = false)
    WITH CHECK (created_by = (SELECT auth.uid()) AND is_global = false);

CREATE POLICY stores_delete_own ON public.stores
    FOR DELETE TO authenticated
    USING (created_by = (SELECT auth.uid()) AND is_global = false);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
