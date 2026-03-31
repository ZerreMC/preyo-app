-- RLS
CREATE OR REPLACE FUNCTION security.is_list_editor(p_list_id uuid, p_user_id uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
SELECT EXISTS (SELECT 1
               FROM public.shopping_lists sl
               WHERE sl.id = p_list_id
                 AND (
                   sl.owner_id = p_user_id
                       OR EXISTS (SELECT 1
                                  FROM public.shopping_list_collaborators c
                                  WHERE c.list_id = p_list_id
                                    AND c.user_id = p_user_id
                                    AND c.role IN ('OWNER', 'EDITOR'))
                   ));
$$;

CREATE OR REPLACE FUNCTION security.is_list_owner(p_list_id uuid, p_user_id uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
SELECT EXISTS (SELECT 1
               FROM public.shopping_lists sl
               WHERE sl.id = p_list_id
                 AND (
                   sl.owner_id = p_user_id
                       OR EXISTS (SELECT 1
                                  FROM public.shopping_list_collaborators c
                                  WHERE c.list_id = p_list_id
                                    AND c.user_id = p_user_id
                                    AND c.role = 'OWNER')
                   ));
$$;

CREATE OR REPLACE FUNCTION security.is_list_member(p_list_id uuid, p_user_id uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
SELECT EXISTS (SELECT 1
               FROM public.shopping_lists sl
               WHERE sl.id = p_list_id
                 AND (
                   sl.owner_id = p_user_id
                       OR EXISTS (SELECT 1
                                  FROM public.shopping_list_collaborators c
                                  WHERE c.list_id = p_list_id
                                    AND c.user_id = p_user_id
                                    AND c.role IN ('OWNER', 'EDITOR', 'VIEWER'))
                   ));
$$;

GRANT EXECUTE ON FUNCTION security.is_list_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION security.is_list_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION security.is_list_editor(uuid, uuid) TO authenticated;

-- Drop old policies if they already exist
DROP POLICY IF EXISTS lists_select_member ON public.shopping_lists;
DROP POLICY IF EXISTS items_select_member ON public.shopping_list_items;
DROP POLICY IF EXISTS collab_select_member ON public.shopping_list_collaborators;
DROP POLICY IF EXISTS lists_insert_owner ON public.shopping_lists;
DROP POLICY IF EXISTS items_no_direct_write ON public.shopping_list_items;
DROP POLICY IF EXISTS lists_no_direct_write ON public.shopping_lists;
DROP POLICY IF EXISTS lists_no_update ON public.shopping_lists;
DROP POLICY IF EXISTS lists_no_delete ON public.shopping_lists;
DROP POLICY IF EXISTS collab_no_direct_write ON public.shopping_list_collaborators;

-- RLS habilitado (obligatorio para que las policies tengan efecto)
ALTER TABLE public.shopping_lists
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_collaborators
    ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY lists_select_member ON public.shopping_lists
    FOR SELECT
    TO authenticated
    USING (security.is_list_member(id, auth.uid()));

CREATE POLICY items_select_member ON public.shopping_list_items
    FOR SELECT
    TO authenticated
    USING (security.is_list_member(list_id, auth.uid()));

CREATE POLICY collab_select_member ON public.shopping_list_collaborators
    FOR SELECT
    TO authenticated
    USING (security.is_list_member(list_id, auth.uid()));

CREATE POLICY lists_insert_owner ON public.shopping_lists
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY lists_no_update ON public.shopping_lists
    FOR UPDATE
    TO authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY lists_no_delete ON public.shopping_lists
    FOR DELETE
    TO authenticated
    USING (false);

CREATE POLICY items_no_direct_write ON public.shopping_list_items
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY collab_no_direct_write ON public.shopping_list_collaborators
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);