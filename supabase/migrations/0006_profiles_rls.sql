-- RLS policies for profiles and user_preferences.

CREATE OR REPLACE FUNCTION security.is_own_profile(p_user_id uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
SELECT p_user_id = (SELECT auth.uid());
$$;

GRANT EXECUTE ON FUNCTION security.is_own_profile(uuid) TO authenticated;

ALTER TABLE public.profiles
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own_or_collaborator ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS preferences_select_own ON public.user_preferences;
DROP POLICY IF EXISTS preferences_insert_own ON public.user_preferences;
DROP POLICY IF EXISTS preferences_update_own ON public.user_preferences;
DROP POLICY IF EXISTS preferences_delete_own ON public.user_preferences;

-- profiles: propio + colaboradores de listas compartidas
-- (necesario para que cl_add_collaborator_by_email pueda leer email_public del target)
CREATE POLICY profiles_select_own_or_collaborator ON public.profiles
    FOR SELECT TO authenticated
    USING (
    security.is_own_profile(id)
        OR EXISTS (SELECT 1
                   FROM public.shopping_list_collaborators slc1
                            JOIN public.shopping_list_collaborators slc2
                                 ON slc1.list_id = slc2.list_id
                   WHERE slc1.user_id = (SELECT auth.uid())
                     AND slc2.user_id = profiles.id)
    );

-- UPDATE: solo propio
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE TO authenticated
    USING (security.is_own_profile(id))
    WITH CHECK (security.is_own_profile(id));

-- user_preferences
CREATE POLICY preferences_select_own ON public.user_preferences
    FOR SELECT TO authenticated
    USING (security.is_own_profile(user_id));

CREATE POLICY preferences_insert_own ON public.user_preferences
    FOR INSERT TO authenticated
    WITH CHECK (security.is_own_profile(user_id));

CREATE POLICY preferences_update_own ON public.user_preferences
    FOR UPDATE TO authenticated
    USING (security.is_own_profile(user_id))
    WITH CHECK (security.is_own_profile(user_id));

CREATE POLICY preferences_delete_own ON public.user_preferences
    FOR DELETE TO authenticated
    USING (security.is_own_profile(user_id));

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
