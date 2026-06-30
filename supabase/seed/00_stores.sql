-- Seed: stores (reference data, safe for all environments)
-- Feature: price-comparison / stores catalog.

INSERT INTO public.stores (id, name, slug, chain, address, city, postal_code, latitude, longitude,
                           created_by, is_global, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Mercadona', 'mercadona', 'Mercadona', NULL, NULL, NULL, NULL, NULL,
        NULL, true, now(), now()),
       ('a0000000-0000-0000-0000-000000000002', 'Lidl', 'lidl', 'Lidl', NULL, NULL, NULL, NULL, NULL, NULL,
        true, now(), now()),
       ('a0000000-0000-0000-0000-000000000003', 'Carrefour', 'carrefour', 'Carrefour', NULL, NULL, NULL, NULL, NULL,
        NULL, true, now(), now()),
       ('a0000000-0000-0000-0000-000000000004', 'Aldi', 'aldi', 'Aldi', NULL, NULL, NULL, NULL, NULL, NULL,
        true, now(), now()),
       ('a0000000-0000-0000-0000-000000000005', 'Dia', 'dia', 'Dia', NULL, NULL, NULL, NULL, NULL, NULL,
        true, now(), now()),
       ('a0000000-0000-0000-0000-000000000006', 'Alcampo', 'alcampo', 'Alcampo', NULL, NULL, NULL, NULL, NULL,
        NULL, true, now(), now())
ON CONFLICT DO NOTHING;
