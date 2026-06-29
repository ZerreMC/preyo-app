-- Shopping-mode state on list items: who bought it, real price, not-found and
-- store reassignment ("moved here"). Extends shopping_list_items and adds the
-- cl_* RPCs the Shopping Mode UI needs. Item changes already broadcast via the
-- on_list_item_change trigger (0004), so these updates propagate in realtime.

-- COLUMNS
ALTER TABLE public.shopping_list_items
    ADD COLUMN IF NOT EXISTS assigned_store_id  uuid        NULL REFERENCES public.stores (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS purchased_by       uuid        NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS purchased_at       timestamptz NULL,
    ADD COLUMN IF NOT EXISTS not_found          boolean     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS actual_price_cents integer     NULL CHECK (actual_price_cents IS NULL OR actual_price_cents >= 0),
    ADD COLUMN IF NOT EXISTS moved              boolean     NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ix_items_assigned_store ON public.shopping_list_items (assigned_store_id);

-- RPC

-- Mark an item as purchased / un-purchased, optionally with the real price.
-- Real price is optional: shopping never blocks on entering it.
CREATE OR REPLACE FUNCTION public.cl_set_item_purchased(
    p_command_id uuid,
    p_list_id uuid,
    p_item_id uuid,
    p_purchased boolean,
    p_actual_price_cents integer
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_status          public.list_status;
    v_last_command_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT status, last_command_id
    INTO v_status, v_last_command_id
    FROM public.shopping_lists
    WHERE id = p_list_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;
    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;
    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;
    IF v_status NOT IN ('active', 'shopping') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;
    IF p_actual_price_cents IS NOT NULL AND p_actual_price_cents < 0 THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    UPDATE public.shopping_list_items
    SET checked            = p_purchased,
        purchased_by       = CASE WHEN p_purchased THEN auth.uid() ELSE NULL END,
        purchased_at       = CASE WHEN p_purchased THEN now() ELSE NULL END,
        actual_price_cents = COALESCE(p_actual_price_cents, actual_price_cents),
        last_command_id    = p_command_id
    WHERE id = p_item_id
      AND list_id = p_list_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'ITEM_NOT_FOUND';
    END IF;

    UPDATE public.shopping_lists
    SET last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
END;
$$;

-- Toggle the "not found" flag on an item.
CREATE OR REPLACE FUNCTION public.cl_set_item_not_found(
    p_command_id uuid,
    p_list_id uuid,
    p_item_id uuid,
    p_not_found boolean
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_status          public.list_status;
    v_last_command_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT status, last_command_id
    INTO v_status, v_last_command_id
    FROM public.shopping_lists
    WHERE id = p_list_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;
    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;
    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;
    IF v_status NOT IN ('active', 'shopping') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;

    UPDATE public.shopping_list_items
    SET not_found       = p_not_found,
        last_command_id = p_command_id
    WHERE id = p_item_id
      AND list_id = p_list_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'ITEM_NOT_FOUND';
    END IF;

    UPDATE public.shopping_lists
    SET last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
END;
$$;

-- Move an item to another store (sets assigned_store_id + moved flag).
CREATE OR REPLACE FUNCTION public.cl_move_item(
    p_command_id uuid,
    p_list_id uuid,
    p_item_id uuid,
    p_store_id uuid
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_status          public.list_status;
    v_last_command_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT status, last_command_id
    INTO v_status, v_last_command_id
    FROM public.shopping_lists
    WHERE id = p_list_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;
    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;
    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;
    IF v_status NOT IN ('active', 'shopping') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id) THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    UPDATE public.shopping_list_items
    SET assigned_store_id = p_store_id,
        moved             = true,
        not_found         = false,
        last_command_id   = p_command_id
    WHERE id = p_item_id
      AND list_id = p_list_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'ITEM_NOT_FOUND';
    END IF;

    UPDATE public.shopping_lists
    SET last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cl_set_item_purchased(uuid, uuid, uuid, boolean, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_set_item_not_found(uuid, uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_move_item(uuid, uuid, uuid, uuid) TO authenticated;
