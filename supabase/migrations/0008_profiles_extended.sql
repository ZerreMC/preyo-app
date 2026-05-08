ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email_public    boolean     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS locale          text        NOT NULL DEFAULT 'es'
        CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
    ADD COLUMN IF NOT EXISTS timezone        text        NOT NULL DEFAULT 'Europe/Madrid',
    ADD COLUMN IF NOT EXISTS currency        text        NOT NULL DEFAULT 'EUR'
        CHECK (currency ~ '^[A-Z]{3}$'),
    ADD COLUMN IF NOT EXISTS plan            text        NOT NULL DEFAULT 'basic'
        CHECK (plan IN ('basic', 'premium')),
    ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz NULL;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_email_public ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own_or_collaborator ON public.profiles;

CREATE POLICY profiles_select_own_or_collaborator ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
    security.is_own_profile(id)
        OR
    EXISTS (SELECT 1
            FROM public.shopping_list_collaborators slc1
                     JOIN public.shopping_list_collaborators slc2
                          ON slc1.list_id = slc2.list_id
            WHERE slc1.user_id = (SELECT auth.uid())
              AND slc2.user_id = profiles.id)
    );

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
    v_email_public   boolean;
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

    SELECT email_public
    INTO v_email_public
    FROM public.profiles
    WHERE id = v_target_user_id;

    IF NOT FOUND OR NOT v_email_public THEN
        RAISE EXCEPTION USING MESSAGE = 'USER_NOT_FOUND';
    END IF;

    INSERT INTO public.shopping_list_collaborators (list_id, user_id, role)
    VALUES (p_list_id, v_target_user_id, v_role)
    ON CONFLICT (list_id, user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cl_add_collaborator_by_email(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
BEGIN
    INSERT INTO public.profiles (id, display_name, locale, timezone)
    VALUES (NEW.id,
            COALESCE(btrim(NEW.raw_user_meta_data ->> 'display_name'), ''),
            COALESCE(
                    CASE
                        WHEN (NEW.raw_user_meta_data ->> 'locale') ~ '^[a-z]{2}(-[A-Z]{2})?$'
                            THEN NEW.raw_user_meta_data ->> 'locale'
                        ELSE NULL END,
                    'es'
            ),
            COALESCE(
                    NULLIF(btrim(COALESCE(NEW.raw_user_meta_data ->> 'timezone', '')), ''),
                    'Europe/Madrid'
            ))
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;