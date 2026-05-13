-- Link shopping_list_items with real products.
-- Compatible migration: existing rows keep product_id = NULL.
-- name_snapshot and ean_snapshot it are filled when a product is associated
-- to keep the history unbroken if the product name changes.

ALTER TABLE public.shopping_list_items
    ADD COLUMN IF NOT EXISTS product_id    uuid NULL
                                                REFERENCES public.products (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS name_snapshot text NULL,
    ADD COLUMN IF NOT EXISTS ean_snapshot  text NULL;

CREATE INDEX IF NOT EXISTS ix_items_product_id
    ON public.shopping_list_items (product_id)
    WHERE product_id IS NOT NULL;

UPDATE public.shopping_list_items
SET name_snapshot = name
WHERE name_snapshot IS NULL;