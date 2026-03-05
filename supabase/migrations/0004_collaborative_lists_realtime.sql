-- Realtime broadcast + authorization

-- Enable row level security
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to receive messages on their own lists
CREATE POLICY realtime_can_receive_list_topics ON realtime.messages
FOR SELECT
TO authenticated
USING (
    split_part((SELECT realtime.topic()), ':', 1) = 'list'
    AND security.is_list_member(
        (split_part((SELECT realtime.topic()), ':', 2))::uuid,
        auth.uid()
    )
);

-- Notify realtime subscribers when shopping list items change
CREATE OR REPLACE FUNCTION public.broadcast_list_items_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, realtime
AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
        'list:' || COALESCE(NEW.list_id, OLD.list_id)::text,
        TG_OP,
        TG_OP,
        TG_TABLE_NAME,
        TG_TABLE_SCHEMA,
        NEW,
        OLD
    );
    RETURN NULL;
END;
$$;

-- Trigger
-- Difusion will automatically remove the trigger when the list is deleted
DROP TRIGGER IF EXISTS trg_broadcast_items ON public.shopping_list_items;
CREATE TRIGGER trg_broadcast_items
AFTER INSERT OR UPDATE OR DELETE ON public.shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_list_items_changes();