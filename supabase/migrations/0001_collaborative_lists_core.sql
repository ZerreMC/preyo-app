-- Core schema for collaborative lists: tables, indexes, updated_at triggers.

-- SCHEMA
CREATE SCHEMA IF NOT EXISTS security;

-- TYPES
-- List status
CREATE TYPE public.list_status AS ENUM ('draft','active','shopping','completed','archived');

-- TABLES
-- Shopping lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id uuid PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    status public.list_status NOT NULL DEFAULT 'draft',
    transport_capacity_g integer NOT NULL CHECK (transport_capacity_g > 0),
    last_command_id uuid NULL,
    last_command_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Collaborators
CREATE TABLE IF NOT EXISTS public.shopping_list_collaborators (
    list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (list_id, user_id)
);

-- Items
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id uuid PRIMARY KEY,
    list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    product_ref text NOT NULL,
    name text NOT NULL,
    quantity text NULL,
    estimated_weight_g integer NOT NULL CHECK (estimated_weight_g >= 0),
    checked boolean NOT NULL DEFAULT false,
    last_command_id uuid NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- INDEXES
-- Unique product within a list
CREATE UNIQUE INDEX IF NOT EXISTS ux_items_list_product_ref_ci ON public.shopping_list_items(list_id, lower(product_ref));

-- Index to RLS performance (Joins and Filters by users/list)
CREATE INDEX IF NOT EXISTS ix_lists_owner on public.shopping_lists(owner_id);
CREATE INDEX IF NOT EXISTS ix_collab_user on public.shopping_list_collaborators(user_id);
CREATE INDEX IF NOT EXISTS ix_items_list on public.shopping_list_items(list_id);

-- TRIGGERS
-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Touch updated_at on list and item updates
DROP TRIGGER IF EXISTS trg_touch_lists ON public.shopping_lists;
CREATE TRIGGER trg_touch_lists
BEFORE UPDATE ON public.shopping_lists
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- Touch updated_at on item updates
DROP TRIGGER IF EXISTS trg_touch_items ON public.shopping_list_items;
CREATE TRIGGER trg_touch_items
BEFORE UPDATE ON public.shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();