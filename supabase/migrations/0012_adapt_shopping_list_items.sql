-- Vincula shopping_list_items con productos reales.
-- Migración compatible: filas existentes conservan product_id = NULL.
-- name_snapshot y ean_snapshot se rellenan cuando se asocia un producto
-- para que el historial no se corrompa si el producto cambia de nombre.

ALTER TABLE public.shopping_list_items
    ADD COLUMN IF NOT EXISTS product_id    uuid NULL
        REFERENCES public.products(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS name_snapshot text NULL,
    ADD COLUMN IF NOT EXISTS ean_snapshot  text NULL;

CREATE INDEX IF NOT EXISTS ix_items_product_id
    ON public.shopping_list_items (product_id)
    WHERE product_id IS NOT NULL;
