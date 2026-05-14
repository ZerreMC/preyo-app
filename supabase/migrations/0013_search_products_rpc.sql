-- RPC to search products: local + Open Food Facts unified.
-- Return first local products, then OFF results.
-- Priorize: exact barcode match > data_quality_score > name.
CREATE OR REPLACE FUNCTION public.search_products(
    p_query text,
    p_limit integer DEFAULT 20
)
    RETURNS TABLE
            (
                id                 uuid,
                barcode            text,
                name               text,
                brand              text,
                category           text,
                image_url          text,
                source             text,
                off_code           text,
                data_quality_score integer
            )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, off
AS
$$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF btrim(COALESCE(p_query, '')) = '' THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    RETURN QUERY
        WITH local_products AS (SELECT p.id,
                                       p.barcode,
                                       p.name,
                                       p.brand,
                                       p.category,
                                       p.image_url,
                                       p.source,
                                       p.off_code,
                                       p.data_quality_score,
                                       0 AS source_rank
                                FROM public.products p
                                WHERE p.name ILIKE '%' || p_query || '%'
                                   OR p.barcode = p_query
                                   OR p.brand ILIKE '%' || p_query || '%'
                                ORDER BY CASE WHEN p.barcode = p_query THEN 0 ELSE 1 END,
                                         p.data_quality_score DESC,
                                         p.name
                                LIMIT p_limit),
             off_products AS (SELECT NULL::uuid        AS id,
                                     o.code            AS barcode,
                                     o.product_name    AS name,
                                     o.brands          AS brand,
                                     o.categories_tags AS category,
                                     o.image_url,
                                     'off'::text       AS source,
                                     o.code            AS off_code,
                                     0                 AS data_quality_score,
                                     1                 AS source_rank
                              FROM off.products o
                              WHERE o.product_name ILIKE '%' || p_query || '%'
                                 OR o.code = p_query
                                 OR o.brands ILIKE '%' || p_query || '%'
                              ORDER BY CASE WHEN o.code = p_query THEN 0 ELSE 1 END,
                                       o.product_name
                              LIMIT p_limit)
        SELECT x.id,
               x.barcode,
               x.name,
               x.brand,
               x.category,
               x.image_url,
               x.source,
               x.off_code,
               x.data_quality_score
        FROM (SELECT *
              FROM local_products
              UNION ALL
              SELECT *
              FROM off_products) x
        WHERE x.name IS NOT NULL
        ORDER BY x.source_rank,
                 CASE WHEN x.barcode = p_query THEN 0 ELSE 1 END,
                 x.data_quality_score DESC,
                 x.name
        LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products(text, integer) TO authenticated;
