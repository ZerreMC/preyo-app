-- =============================================================
-- Migration: 0017_collaborative_lists_invites_permissions.sql
-- Description: permisos de invitacion, limites y tabla de invitaciones
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.shopping_list_collaborators
    ADD COLUMN IF NOT EXISTS can_invite boolean     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS invited_by uuid        NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS joined_at  timestamptz NULL;

UPDATE public.shopping_list_collaborators
SET joined_at  = COALESCE(joined_at, created_at, now()),
    can_invite = CASE WHEN role = 'OWNER' THEN true ELSE can_invite END
WHERE joined_at IS NULL
   OR role = 'OWNER';

ALTER TABLE public.shopping_list_collaborators
    ALTER COLUMN joined_at SET DEFAULT now(),
    ALTER COLUMN joined_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.shopping_list_invites
(
    id         uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    list_id    uuid        NOT NULL REFERENCES public.shopping_lists (id) ON DELETE CASCADE,
    email      text        NULL,
    role       text        NOT NULL CHECK (role IN ('EDITOR', 'VIEWER')),
    can_invite boolean     NOT NULL DEFAULT false,
    token_hash text        NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at    timestamptz NULL,
    revoked_at timestamptz NULL,
    created_by uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_shopping_list_invites_list_pending
    ON public.shopping_list_invites (list_id, expires_at)
    WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_shopping_list_invites_pending_email
    ON public.shopping_list_invites (list_id, lower(email))
    WHERE email IS NOT NULL AND used_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.shopping_list_invites
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shopping_list_invites_select_member ON public.shopping_list_invites;
CREATE POLICY shopping_list_invites_select_member ON public.shopping_list_invites
    FOR SELECT TO authenticated
    USING (security.is_list_member(list_id, (SELECT auth.uid())));

INSERT INTO public.shopping_list_invites (id,
                                          list_id,
                                          email,
                                          role,
                                          can_invite,
                                          token_hash,
                                          expires_at,
                                          used_at,
                                          revoked_at,
                                          created_by,
                                          created_at)
SELECT token,
       list_id,
       NULL,
       role,
       false,
       encode(extensions.digest(token::text, 'sha256'::text), 'hex'),
       expires_at,
       used_at,
       NULL,
       created_by,
       created_at
FROM public.list_invite_tokens
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION security.can_invite_to_list(p_list_id uuid, p_user_id uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
SELECT EXISTS (SELECT 1
               FROM public.shopping_list_collaborators c
               WHERE c.list_id = p_list_id
                 AND c.user_id = p_user_id
                 AND (
                   c.role = 'OWNER'
                       OR (c.role IN ('EDITOR', 'VIEWER') AND c.can_invite)
                   ));
$$;

GRANT EXECUTE ON FUNCTION security.can_invite_to_list(uuid, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.cl_generate_invite_token(uuid, text);
CREATE OR REPLACE FUNCTION public.cl_generate_invite_token(
    p_list_id uuid,
    p_role text DEFAULT 'EDITOR',
    p_email text DEFAULT NULL,
    p_can_invite boolean DEFAULT false
)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security
AS
$$
DECLARE
    v_token        text := gen_random_uuid()::text || gen_random_uuid()::text;
    v_role         text := upper(btrim(COALESCE(p_role, 'EDITOR')));
    v_email        text := lower(NULLIF(btrim(COALESCE(p_email, '')), ''));
    v_requester    record;
    v_target_user  uuid;
    v_active_slots integer;
    v_recent_count integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF p_list_id IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    PERFORM 1
    FROM public.shopping_lists
    WHERE id = p_list_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    SELECT role, can_invite
    INTO v_requester
    FROM public.shopping_list_collaborators
    WHERE list_id = p_list_id
      AND user_id = auth.uid();

    IF NOT FOUND OR NOT security.can_invite_to_list(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_role NOT IN ('EDITOR', 'VIEWER') THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    IF v_requester.role = 'VIEWER' AND v_role <> 'VIEWER' THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF COALESCE(p_can_invite, false) AND v_requester.role <> 'OWNER' THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF v_email IS NOT NULL AND v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_EMAIL';
    END IF;

    IF v_email IS NOT NULL THEN
        SELECT id
        INTO v_target_user
        FROM auth.users
        WHERE lower(email) = v_email
        LIMIT 1;

        IF v_target_user IS NOT NULL
            AND EXISTS (SELECT 1
                        FROM public.shopping_list_collaborators
                        WHERE list_id = p_list_id
                          AND user_id = v_target_user) THEN
            RAISE EXCEPTION USING MESSAGE = 'ALREADY_MEMBER';
        END IF;

        IF EXISTS (SELECT 1
                   FROM public.shopping_list_invites
                   WHERE list_id = p_list_id
                     AND lower(email) = v_email
                     AND used_at IS NULL
                     AND revoked_at IS NULL
                     AND expires_at > now()) THEN
            RAISE EXCEPTION USING MESSAGE = 'INVITE_PENDING';
        END IF;
    END IF;

    SELECT COUNT(*)
    INTO v_active_slots
    FROM (SELECT 1
          FROM public.shopping_list_collaborators
          WHERE list_id = p_list_id
          UNION ALL
          SELECT 1
          FROM public.shopping_list_invites
          WHERE list_id = p_list_id
            AND used_at IS NULL
            AND revoked_at IS NULL
            AND expires_at > now()) slots;

    IF v_active_slots >= 10 THEN
        RAISE EXCEPTION USING MESSAGE = 'LIMIT_REACHED';
    END IF;

    SELECT COUNT(*)
    INTO v_recent_count
    FROM public.shopping_list_invites
    WHERE created_by = auth.uid()
      AND created_at > now() - interval '1 minute';

    IF v_recent_count >= 5 THEN
        RAISE EXCEPTION USING MESSAGE = 'LIMIT_REACHED';
    END IF;

    INSERT INTO public.shopping_list_invites (list_id,
                                              email,
                                              role,
                                              can_invite,
                                              token_hash,
                                              expires_at,
                                              created_by)
    VALUES (p_list_id,
            v_email,
            v_role,
            COALESCE(p_can_invite, false),
            encode(extensions.digest(v_token, 'sha256'::text), 'hex'),
            now() + interval '3 days',
            auth.uid());

    RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_add_collaborator_by_email(
    p_list_id uuid,
    p_email text,
    p_role text
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
BEGIN
    PERFORM public.cl_generate_invite_token(
            p_list_id := p_list_id,
            p_role := p_role,
            p_email := p_email,
            p_can_invite := false
            );
END;
$$;

DROP FUNCTION IF EXISTS public.cl_accept_invite(uuid);
CREATE OR REPLACE FUNCTION public.cl_accept_invite(p_token text)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security
AS
$$
DECLARE
    v_invite       record;
    v_user_email   text;
    v_collab_count integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF btrim(COALESCE(p_token, '')) = '' THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    SELECT *
    INTO v_invite
    FROM public.shopping_list_invites
    WHERE token_hash = encode(extensions.digest(p_token, 'sha256'::text), 'hex')
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_invite.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_REVOKED';
    END IF;

    IF v_invite.used_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_USED';
    END IF;

    IF v_invite.expires_at <= now() THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_EXPIRED';
    END IF;

    IF v_invite.email IS NOT NULL THEN
        SELECT lower(email)
        INTO v_user_email
        FROM auth.users
        WHERE id = auth.uid();

        IF v_user_email IS DISTINCT FROM lower(v_invite.email) THEN
            RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
        END IF;
    END IF;

    IF EXISTS (SELECT 1
               FROM public.shopping_list_collaborators
               WHERE list_id = v_invite.list_id
                 AND user_id = auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'ALREADY_MEMBER';
    END IF;

    SELECT COUNT(*)
    INTO v_collab_count
    FROM public.shopping_list_collaborators
    WHERE list_id = v_invite.list_id;

    IF v_collab_count >= 10 THEN
        RAISE EXCEPTION USING MESSAGE = 'LIMIT_REACHED';
    END IF;

    INSERT INTO public.shopping_list_collaborators (list_id,
                                                    user_id,
                                                    role,
                                                    can_invite,
                                                    invited_by,
                                                    joined_at)
    VALUES (v_invite.list_id,
            auth.uid(),
            v_invite.role,
            v_invite.can_invite,
            v_invite.created_by,
            now());

    UPDATE public.shopping_list_invites
    SET used_at = now()
    WHERE id = v_invite.id;

    RETURN v_invite.list_id;
END;
$$;

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
DECLARE
    v_target_role text;
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

    SELECT role
    INTO v_target_role
    FROM public.shopping_list_collaborators
    WHERE list_id = p_list_id
      AND user_id = p_target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_target_role = 'OWNER' THEN
        RAISE EXCEPTION USING MESSAGE = 'OWNER_PROTECTED';
    END IF;

    DELETE
    FROM public.shopping_list_collaborators
    WHERE list_id = p_list_id
      AND user_id = p_target_user_id
      AND role <> 'OWNER';
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_update_collaborator_invite_permission(
    p_list_id uuid,
    p_target_user_id uuid,
    p_can_invite boolean
)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_target_role text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF NOT security.is_list_owner(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    SELECT role
    INTO v_target_role
    FROM public.shopping_list_collaborators
    WHERE list_id = p_list_id
      AND user_id = p_target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_target_role = 'OWNER' THEN
        RAISE EXCEPTION USING MESSAGE = 'OWNER_PROTECTED';
    END IF;

    UPDATE public.shopping_list_collaborators
    SET can_invite = COALESCE(p_can_invite, false)
    WHERE list_id = p_list_id
      AND user_id = p_target_user_id
      AND role <> 'OWNER';
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_revoke_invite(p_invite_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_invite record;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT *
    INTO v_invite
    FROM public.shopping_list_invites
    WHERE id = p_invite_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_invite.used_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_USED';
    END IF;

    IF v_invite.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_REVOKED';
    END IF;

    IF NOT security.is_list_owner(v_invite.list_id, auth.uid())
        AND v_invite.created_by <> auth.uid() THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    UPDATE public.shopping_list_invites
    SET revoked_at = now()
    WHERE id = p_invite_id;
END;
$$;

GRANT SELECT ON public.shopping_list_invites TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_add_collaborator_by_email(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_generate_invite_token(uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_accept_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_remove_collaborator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_update_collaborator_invite_permission(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_revoke_invite(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
