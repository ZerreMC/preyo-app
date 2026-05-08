CREATE INDEX IF NOT EXISTS ix_invite_tokens_active
    ON public.list_invite_tokens (list_id, expires_at)
    WHERE used_at IS NULL;

CREATE OR REPLACE FUNCTION public.cl_add_collaborator_by_email(
    p_list_id uuid,
    p_email text,
    p_role text
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security
AS
$$
DECLARE
    v_target_user_id uuid;
    v_role           text := upper(btrim(COALESCE(p_role, '')));
    v_collab_count   integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF NOT security.is_list_owner(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_role NOT IN ('EDITOR', 'VIEWER') THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    SELECT COUNT(*)
    INTO v_collab_count
    FROM public.shopping_list_collaborators
    WHERE list_id = p_list_id;

    IF v_collab_count >= 10 THEN
        RAISE EXCEPTION USING MESSAGE = 'CAPACITY_EXCEEDED';
    END IF;

    SELECT id
    INTO v_target_user_id
    FROM auth.users
    WHERE lower(email) = lower(btrim(COALESCE(p_email, '')))
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'USER_NOT_FOUND';
    END IF;

    INSERT INTO public.shopping_list_collaborators (list_id, user_id, role)
    VALUES (p_list_id, v_target_user_id, v_role)
    ON CONFLICT (list_id, user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_generate_invite_token(
    p_list_id uuid,
    p_role text DEFAULT 'EDITOR'
)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_token        uuid;
    v_role         text := upper(btrim(COALESCE(p_role, 'EDITOR')));
    v_active_count integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF NOT security.is_list_owner(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_role NOT IN ('EDITOR', 'VIEWER') THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    SELECT COUNT(*)
    INTO v_active_count
    FROM public.list_invite_tokens
    WHERE list_id = p_list_id
      AND used_at IS NULL
      AND expires_at > now();

    IF v_active_count >= 3 THEN
        RAISE EXCEPTION USING MESSAGE = 'CAPACITY_EXCEEDED';
    END IF;

    UPDATE public.list_invite_tokens
    SET used_at = now(),
        used_by = auth.uid()
    WHERE list_id = p_list_id
      AND created_by = auth.uid()
      AND role = v_role
      AND used_at IS NULL
      AND expires_at > now();

    INSERT INTO public.list_invite_tokens (list_id, created_by, role, expires_at)
    VALUES (p_list_id, auth.uid(), v_role, now() + interval '7 days')
    RETURNING token INTO v_token;

    RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_purge_expired_tokens()
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
DECLARE
    v_deleted integer;
BEGIN
    DELETE
    FROM public.list_invite_tokens
    WHERE (
              (used_at IS NULL AND expires_at < now())
                  OR
              (used_at IS NOT NULL AND used_at < now() - interval '30 days')
              );

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cl_purge_expired_tokens() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cl_purge_expired_tokens() FROM authenticated;

GRANT EXECUTE ON FUNCTION public.cl_add_collaborator_by_email(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_generate_invite_token(uuid, text) TO authenticated;