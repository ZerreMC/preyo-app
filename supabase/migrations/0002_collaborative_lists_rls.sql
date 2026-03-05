-- RLS
-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_collaborators ENABLE ROW LEVEL SECURITY;

-- Helper Functions
-- Check if the user is a member of a list
CREATE OR REPLACE FUNCTION security.is_list_member(p_list_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.shopping_lists list
        WHERE list.id = p_list_id
            AND (
                list.owner_id = p_user_id
                    OR EXISTS (
                        SELECT 1
                        FROM public.shopping_list_collaborators collab
                        WHERE collab.list_id = p_list_id
                            AND collab.user_id = p_user_id
                    )
            )
    );
$$;

-- Policies
-- Only members can select lists
CREATE POLICY lists_select_member ON public.shopping_lists
FOR SELECT
TO authenticated
USING (security.is_list_member(id, auth.uid()));

-- Only members can select items
CREATE POLICY items_select_member ON public.shopping_list_items
FOR SELECT
TO authenticated
USING (security.is_list_member(list_id, auth.uid()));

-- Only members can select collaborators
CREATE POLICY collab_select_member ON public.shopping_list_collaborators
FOR SELECT
TO authenticated
USING (security.is_list_member(list_id, auth.uid()));

-- Only owner can insert a list
CREATE POLICY lists_insert_owner ON public.shopping_lists
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Block direct writes to items
CREATE POLICY items_no_direct_write ON public.shopping_list_items
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);