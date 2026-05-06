-- RLS policies for profiles and user_preferences.
-- Principle: a user can only read and write their own rows.
-- No cross-user visibility — profiles are private in MVP.

-- HELPER FUNCTIONS (security schema, following 0002 pattern)

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

-- ENABLE RLS

ALTER TABLE public.profiles
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences
    ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES (idempotent re-runs)

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

DROP POLICY IF EXISTS preferences_select_own ON public.user_preferences;
DROP POLICY IF EXISTS preferences_insert_own ON public.user_preferences;
DROP POLICY IF EXISTS preferences_update_own ON public.user_preferences;
DROP POLICY IF EXISTS preferences_delete_own ON public.user_preferences;

-- POLICIES: profiles

-- SELECT: a user can only read their own profile.
-- Post-MVP: if public profiles are added, extend this policy.
CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT
    TO authenticated
    USING (security.is_own_profile(id));

-- INSERT: blocked for direct client writes.
-- The handle_new_user() trigger (SECURITY DEFINER) inserts the row.
-- Keeping this policy absent means no authenticated client can INSERT directly,
-- which is the intended invariant.

-- UPDATE: a user can only update their own profile.
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (security.is_own_profile(id))
    WITH CHECK (security.is_own_profile(id));

-- POLICIES: user_preferences

-- SELECT: own row only.
CREATE POLICY preferences_select_own ON public.user_preferences
    FOR SELECT
    TO authenticated
    USING (security.is_own_profile(user_id));

-- INSERT: user can only create their own preferences row.
-- This is the path taken when onboarding is completed for the first time.
CREATE POLICY preferences_insert_own ON public.user_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (security.is_own_profile(user_id));

-- UPDATE: own row only.
CREATE POLICY preferences_update_own ON public.user_preferences
    FOR UPDATE
    TO authenticated
    USING (security.is_own_profile(user_id))
    WITH CHECK (security.is_own_profile(user_id));

-- DELETE: allow the user to reset their preferences (e.g. clear onboarding).
CREATE POLICY preferences_delete_own ON public.user_preferences
    FOR DELETE
    TO authenticated
    USING (security.is_own_profile(user_id));

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;