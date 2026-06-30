-- Collaborator profile visibility.
-- RLS keeps public.profiles private (each user reads only their own row).
-- To show collaborator names/avatars in shared lists WITHOUT opening profiles,
-- expose a narrow, security-checked RPC that returns only id/display_name/
-- avatar_url for the members of a list the caller belongs to.

CREATE OR REPLACE FUNCTION public.cl_list_members(p_list_id uuid)
    RETURNS TABLE
            (
                user_id      uuid,
                display_name text,
                avatar_url   text,
                role         text
            )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, security
AS
$$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF NOT security.is_list_member(p_list_id, auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    RETURN QUERY
        -- Owner of the list (always OWNER, even if not in the collaborators table).
        SELECT pr.id,
               pr.display_name,
               pr.avatar_url,
               'OWNER'::text AS role
        FROM public.shopping_lists sl
                 JOIN public.profiles pr ON pr.id = sl.owner_id
        WHERE sl.id = p_list_id

        UNION

        -- Explicit collaborators.
        SELECT pr.id,
               pr.display_name,
               pr.avatar_url,
               c.role
        FROM public.shopping_list_collaborators c
                 JOIN public.profiles pr ON pr.id = c.user_id
        WHERE c.list_id = p_list_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cl_list_members(uuid) TO authenticated;
