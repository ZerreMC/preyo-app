-- List invitations: share a list by email or temporary link (24h).
-- Direct table writes are blocked; all mutations go through SECURITY DEFINER
-- RPCs so the membership/owner rules live in one place (same pattern as cl_*).

-- TABLE
CREATE TABLE IF NOT EXISTS public.list_invitations
(
    id          uuid PRIMARY KEY                                                                     DEFAULT gen_random_uuid(),
    list_id     uuid        NOT NULL REFERENCES public.shopping_lists (id) ON DELETE CASCADE,
    email       text        NULL,
    token       text        NOT NULL UNIQUE,
    role        text        NOT NULL CHECK (role IN ('EDITOR', 'VIEWER'))                            DEFAULT 'VIEWER',
    status      text        NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')) DEFAULT 'pending',
    invited_by  uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    accepted_by uuid        NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    accepted_at timestamptz NULL,
    expires_at  timestamptz NOT NULL                                                                 DEFAULT now() + interval '24 hours',
    created_at  timestamptz NOT NULL                                                                 DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_invitations_list ON public.list_invitations (list_id);
CREATE INDEX IF NOT EXISTS ix_invitations_email ON public.list_invitations (lower(email));

-- RLS: members can read invitations of their lists; no direct writes (RPC only).
ALTER TABLE public.list_invitations
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitations_select_member ON public.list_invitations;
CREATE POLICY invitations_select_member ON public.list_invitations
    FOR SELECT TO authenticated
    USING (security.is_list_member(list_id, (select auth.uid())));

GRANT SELECT ON public.list_invitations TO authenticated;

-- RPC

-- Create an invitation. Owner only. Returns the token for the share link.
CREATE OR REPLACE FUNCTION public.cl_create_invitation(
    p_list_id uuid,
    p_email text,
    p_role text
)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_token text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF NOT security.is_list_owner(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    IF p_role NOT IN ('EDITOR', 'VIEWER') THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    -- 64 hex chars without requiring the pgcrypto extension.
    v_token := replace(gen_random_uuid()::text, '-', '')
        || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO public.list_invitations (list_id, email, token, role, invited_by)
    VALUES (p_list_id, nullif(btrim(lower(p_email)), ''), v_token, p_role, auth.uid());

    RETURN v_token;
END;
$$;

-- Accept an invitation by token. Adds the caller as a collaborator.
CREATE OR REPLACE FUNCTION public.cl_accept_invitation(p_token text)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_list_id uuid;
    v_role    text;
    v_status  text;
    v_expires timestamptz;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT list_id, role, status, expires_at
    INTO v_list_id, v_role, v_status, v_expires
    FROM public.list_invitations
    WHERE token = p_token
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITATION_INVALID';
    END IF;

    IF v_status = 'revoked' THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITATION_INVALID';
    END IF;

    IF v_status = 'expired' OR v_expires < now() THEN
        UPDATE public.list_invitations SET status = 'expired' WHERE token = p_token;
        RAISE EXCEPTION USING MESSAGE = 'INVITATION_EXPIRED';
    END IF;

    -- Idempotent: re-accepting keeps the existing membership.
    INSERT INTO public.shopping_list_collaborators (list_id, user_id, role)
    VALUES (v_list_id, auth.uid(), v_role)
    ON CONFLICT (list_id, user_id) DO UPDATE SET role = excluded.role;

    UPDATE public.list_invitations
    SET status      = 'accepted',
        accepted_by = auth.uid(),
        accepted_at = now()
    WHERE token = p_token;

    RETURN v_list_id;
END;
$$;

-- Revoke a pending invitation. Owner only.
CREATE OR REPLACE FUNCTION public.cl_revoke_invitation(p_invitation_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
DECLARE
    v_list_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    SELECT list_id
    INTO v_list_id
    FROM public.list_invitations
    WHERE id = p_invitation_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF NOT security.is_list_owner(v_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    UPDATE public.list_invitations
    SET status = 'revoked'
    WHERE id = p_invitation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cl_create_invitation(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_revoke_invitation(uuid) TO authenticated;
