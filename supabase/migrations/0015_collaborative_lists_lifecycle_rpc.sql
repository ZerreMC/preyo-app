-- =============================================================
-- Migration: 0015_collaborative_lists_lifecycle_rpc.sql
-- Description: Transactional RPCs to create, rename and delete lists
-- =============================================================

-- Create a list and register the caller as its owner.
CREATE OR REPLACE FUNCTION public.cl_create_list(
    p_command_id uuid,
    p_list_id uuid,
    p_title text,
    p_transport_capacity_g integer
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_title text := btrim(COALESCE(p_title, ''));
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF p_command_id IS NULL
        OR p_list_id IS NULL
        OR v_title = ''
        OR p_transport_capacity_g IS NULL
        OR p_transport_capacity_g <= 0 THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    -- Idempotency guard: same command already applied by this owner → no-op.
    IF EXISTS (SELECT 1
               FROM public.shopping_lists
               WHERE id = p_list_id
                 AND owner_id = auth.uid()
                 AND last_command_id = p_command_id) THEN
        RETURN;
    END IF;

    INSERT INTO public.shopping_lists (id,
                                       owner_id,
                                       title,
                                       status,
                                       transport_capacity_g,
                                       last_command_id,
                                       last_command_at)
    VALUES (p_list_id,
            auth.uid(),
            v_title,
            'draft',
            p_transport_capacity_g,
            p_command_id,
            now());

    INSERT INTO public.shopping_list_collaborators (list_id, user_id, role)
    VALUES (p_list_id, auth.uid(), 'OWNER')
    ON CONFLICT (list_id, user_id) DO UPDATE SET role = 'OWNER';
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
END;
$$;

-- Rename an editable list. Allowed for the owner or any editor.
CREATE OR REPLACE FUNCTION public.cl_rename_list(
    p_command_id uuid,
    p_list_id uuid,
    p_title text
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_title           text := btrim(COALESCE(p_title, ''));
    v_status          public.list_status;
    v_last_command_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF p_command_id IS NULL OR p_list_id IS NULL OR v_title = '' THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    -- Acquire a row-level lock to prevent concurrent renames.
    SELECT status, last_command_id
    INTO v_status, v_last_command_id
    FROM public.shopping_lists
    WHERE id = p_list_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    -- Idempotency guard: same command already applied → no-op.
    IF v_last_command_id = p_command_id THEN
        RETURN;
    END IF;

    IF NOT security.is_list_editor(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_status NOT IN ('draft', 'active') THEN
        RAISE EXCEPTION USING MESSAGE = 'LIST_LOCKED';
    END IF;

    UPDATE public.shopping_lists
    SET title           = v_title,
        last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
END;
$$;

-- Delete a list. Only the owner may do this.
-- NOTE: p_command_id is accepted for API consistency but cannot be used
-- for idempotency here because the row no longer exists after the first
-- successful delete. A retry will receive NOT_FOUND instead of a no-op.
-- If full idempotency is required, introduce a soft-delete or event-log.
CREATE OR REPLACE FUNCTION public.cl_delete_list(
    p_command_id uuid,
    p_list_id uuid
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF p_command_id IS NULL OR p_list_id IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = p_list_id) THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF NOT security.is_list_owner(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    DELETE
    FROM public.shopping_lists
    WHERE id = p_list_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cl_create_list(uuid, uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_rename_list(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_delete_list(uuid, uuid) TO authenticated;

-- Reload PostgREST schema cache to expose the new RPCs.
NOTIFY pgrst, 'reload schema';