-- Transactional RPC for collaborative lists

CREATE OR REPLACE FUNCTION public.cl_add_item(
    p_command_id uuid,
    p_list_id uuid,
    p_item_id uuid,
    p_product_ref text,
    p_name text,
    p_quantity text,
    p_estimated_weight_g integer
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_status          public.list_status;
    v_capacity        integer;
    v_last_command_id uuid;
    v_current_weight  integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT status, transport_capacity_g, last_command_id
    INTO v_status, v_capacity, v_last_command_id
    FROM public.shopping_lists
    WHERE id = p_list_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;

    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_status NOT IN ('draft', 'active') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;

    IF btrim(COALESCE(p_product_ref, '')) = '' OR btrim(COALESCE(p_name, '')) = '' THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    IF p_estimated_weight_g IS NULL
       OR p_estimated_weight_g < 0
       OR p_estimated_weight_g != floor(p_estimated_weight_g) THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    SELECT COALESCE(SUM(estimated_weight_g), 0)
    INTO v_current_weight
    FROM public.shopping_list_items
    WHERE list_id = p_list_id;

    IF (v_current_weight + p_estimated_weight_g) > v_capacity THEN
        RAISE EXCEPTION USING MESSAGE = 'CAPACITY_EXCEEDED';
    END IF;

    BEGIN
        INSERT INTO public.shopping_list_items (id,
                                                list_id,
                                                product_ref,
                                                name,
                                                quantity,
                                                estimated_weight_g,
                                                checked,
                                                last_command_id)
        VALUES (p_item_id,
                p_list_id,
                btrim(p_product_ref),
                btrim(p_name),
                p_quantity,
                p_estimated_weight_g,
                false,
                p_command_id);
    EXCEPTION
        WHEN unique_violation THEN
            IF EXISTS (SELECT 1
                       FROM public.shopping_list_items
                       WHERE id = p_item_id
                         AND list_id = p_list_id) THEN
                RETURN;
            END IF;

            RAISE EXCEPTION USING MESSAGE = 'DUPLICATE_PRODUCT';
    END;

    UPDATE public.shopping_lists
    SET last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_remove_item(
    p_command_id uuid,
    p_list_id uuid,
    p_item_id uuid
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
    WHERE id = p_list_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;

    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_status NOT IN ('draft', 'active') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;

    DELETE
    FROM public.shopping_list_items
    WHERE id = p_item_id
      AND list_id = p_list_id;

    UPDATE public.shopping_lists
    SET last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_change_status(
    p_command_id uuid,
    p_list_id uuid,
    p_next_status public.list_status
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_status             public.list_status;
    v_last_command_id    uuid;
    v_transition_allowed boolean := false;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT status, last_command_id
    INTO v_status, v_last_command_id
    FROM public.shopping_lists
    WHERE id = p_list_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;

    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_status IN ('completed', 'archived') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;

    IF v_status = p_next_status THEN
        UPDATE public.shopping_lists
        SET last_command_id = p_command_id,
            last_command_at = now()
        WHERE id = p_list_id;
        RETURN;
    END IF;

    v_transition_allowed :=
            (v_status = 'draft' AND p_next_status IN ('active', 'archived'))
                OR (v_status = 'active' AND p_next_status IN ('shopping', 'archived'))
                OR (v_status = 'shopping' AND p_next_status IN ('completed', 'archived'));

    IF NOT v_transition_allowed THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_STATUS_TRANSITION';
    END IF;

    UPDATE public.shopping_lists
    SET status          = p_next_status,
        last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_toggle_item(
    p_command_id uuid,
    p_list_id uuid,
    p_item_id uuid,
    p_checked boolean
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
    WHERE id = p_list_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;

    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_status NOT IN ('draft', 'active', 'shopping') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;

    UPDATE public.shopping_list_items
    SET checked         = p_checked,
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

GRANT EXECUTE ON FUNCTION public.cl_add_item(uuid, uuid, uuid, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_remove_item(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_toggle_item(uuid, uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_change_status(uuid, uuid, public.list_status) TO authenticated;
