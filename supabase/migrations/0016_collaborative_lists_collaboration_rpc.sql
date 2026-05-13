-- =============================================================
-- Migration: 0016_collaborative_lists_collaboration_rpc.sql
-- Description: RPCs to remove collaborators and accept invitations
-- =============================================================

-- Remove a collaborator from a list. Only the owner may do this.
CREATE OR REPLACE FUNCTION public.cl_remove_collaborator(
    p_list_id uuid,
    p_target_user_id uuid
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

    IF p_list_id IS NULL OR p_target_user_id IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    IF NOT security.is_list_owner(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    -- The owner cannot remove themselves.
    IF security.is_list_owner(p_list_id, p_target_user_id) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    -- The role <> 'OWNER' guard is a safety net in case the check above
    -- is bypassed; it ensures the owner row is never deleted.
    DELETE
    FROM public.shopping_list_collaborators
    WHERE list_id = p_list_id
      AND user_id = p_target_user_id
      AND role <> 'OWNER';
END;
$$;

-- Accept a single-use list invitation token.
-- Returns the list_id on success.
CREATE OR REPLACE FUNCTION public.cl_accept_invite(
    p_token uuid
)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_list_id      uuid;
    v_role         text;
    v_collab_count integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF p_token IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    -- Lock the token row to prevent concurrent acceptance of the same invite.
    SELECT list_id, role
    INTO v_list_id, v_role
    FROM public.list_invite_tokens
    WHERE token = p_token
      AND used_at IS NULL
      AND expires_at > now()
        FOR UPDATE;

    IF NOT FOUND THEN
        -- Distinguish between already-used, expired and genuinely missing tokens
        -- so the client can display an appropriate error message.
        IF EXISTS (SELECT 1
                   FROM public.list_invite_tokens
                   WHERE token = p_token
                     AND used_at IS NOT NULL) THEN
            RAISE EXCEPTION USING MESSAGE = 'INVITE_USED';
        END IF;

        IF EXISTS (SELECT 1
                   FROM public.list_invite_tokens
                   WHERE token = p_token
                     AND used_at IS NULL
                     AND expires_at <= now()) THEN
            RAISE EXCEPTION USING MESSAGE = 'INVITE_EXPIRED';
        END IF;

        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    SELECT COUNT(*)
    INTO v_collab_count
    FROM public.shopping_list_collaborators
    WHERE list_id = v_list_id;

    -- Enforce the 10-collaborator cap only for users not already on the list,
    -- so that existing collaborators can re-accept without being blocked.
    IF v_collab_count >= 10
        AND NOT EXISTS (SELECT 1
                        FROM public.shopping_list_collaborators
                        WHERE list_id = v_list_id
                          AND user_id = auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'CAPACITY_EXCEEDED';
    END IF;

    INSERT INTO public.shopping_list_collaborators (list_id, user_id, role)
    VALUES (v_list_id, auth.uid(), v_role)
    ON CONFLICT (list_id, user_id) DO UPDATE
        SET role = CASE
                       WHEN public.shopping_list_collaborators.role = 'OWNER' THEN 'OWNER'
                       ELSE EXCLUDED.role
            END;

    -- Mark the token as consumed.
    UPDATE public.list_invite_tokens
    SET used_at = now(),
        used_by = auth.uid()
    WHERE token = p_token;

    RETURN v_list_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cl_remove_collaborator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_accept_invite(uuid) TO authenticated;

-- Reload PostgREST schema cache to expose the new RPCs.
NOTIFY pgrst, 'reload schema';