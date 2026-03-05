-- Transactional functions (commands)


-- Add item to a shopping list (command)
CREATE OR REPLACE FUNCTION public.cl_add_item(
    p_command_id uuid,
    p_list_id uuid,
    p_item_id uuid,
    p_product_ref text,
    p_name text,
    p_quantity text,
    p_estimated_weight_g integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, security
AS $$
    -- Check if the user is authenticated
    DECLARE
    v_status public.list_status;
        v_capacity integer;
        v_current  integer;
    BEGIN
        IF auth.uid() IS NULL THEN
            RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- Check if a list exists
    SELECT status, transport_capacity_g
    INTO v_status, v_capacity
    FROM public.shopping_lists
    WHERE id = p_list_id
        FOR UPDATE;

    IF NOT FOUND THEN
            RAISE EXCEPTION 'NOT_FOUND';
    END IF;

    -- Check if a list is not full
    SELECT COALESCE(SUM(estimated_weight_g), 0)
    INTO v_current
    FROM public.shopping_list_items
    WHERE list_id = p_list_id;

    IF (v_current + p_estimated_weight_g) > v_capacity THEN
            RAISE EXCEPTION 'CAPACITY_EXCEEDED';
    END IF;

    -- Add item to a list
    INSERT INTO public.shopping_list_items (
        id,
        list_id,
        product_ref,
        name,
        quantity,
        estimated_weight_g,
        checked,
        last_command_id
    ) VALUES (
        p_item_id,
        p_list_id,
        p_product_ref,
        p_name,
        p_quantity,
        p_estimated_weight_g,
        false,
        p_command_id
    );

    -- Update last command
    UPDATE public.shopping_lists
    SET last_command_id = p_command_id,
        last_command_at = now()
    WHERE id = p_list_id;
    END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.cl_add_item(uuid, uuid, uuid, text, text, text, integer) TO authenticated;