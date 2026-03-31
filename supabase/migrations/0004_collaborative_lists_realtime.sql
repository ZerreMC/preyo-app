-- Función para los items
CREATE OR REPLACE FUNCTION public.broadcast_list_item_changes()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, realtime
AS
$$
DECLARE
    topic TEXT;
BEGIN
    topic := 'list:' || COALESCE(NEW.list_id, OLD.list_id)::TEXT;

    PERFORM realtime.broadcast_changes(
            topic, TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD
            );

    RETURN NEW;
END;
$$;

-- Función para las listas
CREATE OR REPLACE FUNCTION public.broadcast_list_changes()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, realtime
AS
$$
DECLARE
    topic TEXT;
BEGIN
    topic := 'list:' || COALESCE(NEW.id, OLD.id)::TEXT;

    PERFORM realtime.broadcast_changes(
            topic, TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD
            );

    RETURN NEW;
END;
$$;

-- Trigger en shopping_list_items
DROP TRIGGER IF EXISTS on_list_item_change ON public.shopping_list_items;
CREATE TRIGGER on_list_item_change
    AFTER INSERT OR UPDATE OR DELETE
    ON public.shopping_list_items
    FOR EACH ROW
EXECUTE FUNCTION public.broadcast_list_item_changes();

-- Trigger en shopping_lists
DROP TRIGGER IF EXISTS on_list_change ON public.shopping_lists;
CREATE TRIGGER on_list_change
    AFTER UPDATE
    ON public.shopping_lists
    FOR EACH ROW
EXECUTE FUNCTION public.broadcast_list_changes();

-- RLS para realtime (Broadcast Privado)
ALTER TABLE realtime.messages
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_messages_lists" ON realtime.messages;
CREATE POLICY "realtime_messages_lists" ON realtime.messages
    FOR SELECT TO authenticated
    USING (
    topic LIKE 'list:%' AND
    security.is_list_member(
            (substring(topic from 6))::uuid,
            auth.uid()
    )
    );