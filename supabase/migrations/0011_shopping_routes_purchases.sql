-- Shopping routes and purchase history.
-- shopping_routes backs /shopping/[routeId] (which stores, in what order).
-- purchases is the finalized summary that feeds spend/savings statistics.
--
-- NOTE: forward-looking. The Shopping Mode frontend is not wired yet, so these
-- tables may evolve. Writes use RLS (editor/member) rather than RPCs for now,
-- since these are higher-level aggregates, not concurrency-critical item edits.

-- TABLES

CREATE TABLE IF NOT EXISTS public.shopping_routes
(
    id           uuid PRIMARY KEY                                                            DEFAULT gen_random_uuid(),
    list_id      uuid        NOT NULL REFERENCES public.shopping_lists (id) ON DELETE CASCADE,
    owner_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    status       text        NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    -- Ordered list of store ids to visit. text[]/uuid[] keeps it simple for MVP.
    store_order  uuid[]      NOT NULL                                                        DEFAULT '{}',
    started_at   timestamptz NOT NULL                                                        DEFAULT now(),
    completed_at timestamptz NULL,
    created_at   timestamptz NOT NULL                                                        DEFAULT now(),
    updated_at   timestamptz NOT NULL                                                        DEFAULT now()
);

-- At most one active route per list.
CREATE UNIQUE INDEX IF NOT EXISTS ux_routes_active_per_list
    ON public.shopping_routes (list_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS ix_routes_list ON public.shopping_routes (list_id);

CREATE TABLE IF NOT EXISTS public.purchases
(
    id                      uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    route_id                uuid        NULL REFERENCES public.shopping_routes (id) ON DELETE SET NULL,
    list_id                 uuid        NOT NULL REFERENCES public.shopping_lists (id) ON DELETE CASCADE,
    user_id                 uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    total_spent_cents       integer     NOT NULL DEFAULT 0 CHECK (total_spent_cents >= 0),
    estimated_savings_cents integer     NOT NULL DEFAULT 0,
    items_bought            integer     NOT NULL DEFAULT 0 CHECK (items_bought >= 0),
    items_total             integer     NOT NULL DEFAULT 0 CHECK (items_total >= 0),
    stores_visited          integer     NOT NULL DEFAULT 0 CHECK (stores_visited >= 0),
    completed_at            timestamptz NOT NULL DEFAULT now(),
    created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_purchases_list ON public.purchases (list_id);
CREATE INDEX IF NOT EXISTS ix_purchases_user ON public.purchases (user_id, completed_at DESC);

-- TRIGGERS (reuse public.touch_updated_at from 0001)
DROP TRIGGER IF EXISTS trg_touch_routes ON public.shopping_routes;
CREATE TRIGGER trg_touch_routes
    BEFORE UPDATE
    ON public.shopping_routes
    FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.shopping_routes
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS routes_select_member ON public.shopping_routes;
DROP POLICY IF EXISTS routes_insert_editor ON public.shopping_routes;
DROP POLICY IF EXISTS routes_update_editor ON public.shopping_routes;
DROP POLICY IF EXISTS purchases_select_member ON public.purchases;
DROP POLICY IF EXISTS purchases_insert_member ON public.purchases;

-- Routes: visible to list members; created/updated by editors.
CREATE POLICY routes_select_member ON public.shopping_routes
    FOR SELECT TO authenticated
    USING (security.is_list_member(list_id, (select auth.uid())));

CREATE POLICY routes_insert_editor ON public.shopping_routes
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = (select auth.uid())
    AND security.is_list_editor(list_id, (select auth.uid())));

CREATE POLICY routes_update_editor ON public.shopping_routes
    FOR UPDATE TO authenticated
    USING (security.is_list_editor(list_id, (select auth.uid())))
    WITH CHECK (security.is_list_editor(list_id, (select auth.uid())));

-- Purchases: visible to list members; inserted by the member who finalizes.
CREATE POLICY purchases_select_member ON public.purchases
    FOR SELECT TO authenticated
    USING (security.is_list_member(list_id, (select auth.uid())));

CREATE POLICY purchases_insert_member ON public.purchases
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid())
    AND security.is_list_member(list_id, (select auth.uid())));

GRANT SELECT, INSERT, UPDATE ON public.shopping_routes TO authenticated;
GRANT SELECT, INSERT ON public.purchases TO authenticated;
