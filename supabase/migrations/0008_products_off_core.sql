-- Catálogo Open Food Facts (ODbL).
-- Schema separado: los datos externos nunca se mezclan con tablas de usuario.
-- Fuente: https://world.openfoodfacts.org — atribución obligatoria por ODbL.
CREATE SCHEMA IF NOT EXISTS off;

CREATE TABLE IF NOT EXISTS off.products
(
    code            text        PRIMARY KEY,  -- EAN/barcode de OFF
    product_name    text        NULL,
    brands          text        NULL,
    quantity        text        NULL,
    categories_tags text        NULL,
    countries_tags  text        NULL,
    image_url       text        NULL,
    last_modified_t integer     NULL,         -- unix timestamp del feed OFF
    raw_json        jsonb       NULL,
    imported_at     timestamptz NOT NULL DEFAULT now()
);

-- Full-text search sobre nombre de producto
CREATE INDEX IF NOT EXISTS ix_off_products_fts
    ON off.products USING gin(to_tsvector('spanish', coalesce(product_name, '')));
CREATE INDEX IF NOT EXISTS ix_off_products_brands ON off.products (brands);

-- RLS: lectura pública para autenticados, escritura solo service_role (import scripts)
ALTER TABLE off.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS off_products_select ON off.products;
CREATE POLICY off_products_select ON off.products
    FOR SELECT TO authenticated USING (true);

GRANT USAGE ON SCHEMA off TO authenticated;
GRANT SELECT ON off.products TO authenticated;
