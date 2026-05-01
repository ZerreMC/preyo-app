-- Core schema for user profiles and onboarding preferences.

-- TYPES
-- Transport mode used in shopping route planning
DO
$$
    BEGIN
        CREATE TYPE public.transport_mode AS ENUM ('foot', 'car', 'public_transport');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END
$$;

-- Load capacity used in route optimizer weight checks
DO
$$
    BEGIN
        CREATE TYPE public.load_capacity AS ENUM ('low', 'medium', 'high');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END
$$;

-- Primary goal declared during onboarding
DO
$$
    BEGIN
        CREATE TYPE public.main_goal AS ENUM ('save_money', 'save_time', 'organize');
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END
$$;
-- TABLES

-- profiles
-- One row per auth.users entry. Created automatically via trigger.
-- Stores display data and onboarding completion flag only.
-- No PII beyond what the user explicitly sets.
CREATE TABLE IF NOT EXISTS public.profiles
(
    id              uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    display_name    text        NOT NULL DEFAULT '',
    avatar_url      text        NULL,
    onboarding_done boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- user_preferences
-- Optional onboarding data. Created only when the user completes or saves the
-- onboarding screen. Intentionally decoupled from profiles so that skipping
-- onboarding never leaves a half-filled row.
CREATE TABLE IF NOT EXISTS public.user_preferences
(
    user_id               uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    postal_code           text                  NULL,
    transport_mode        public.transport_mode NULL,
    load_capacity         public.load_capacity  NULL,
    main_goal             public.main_goal      NULL,
    -- Preferred store names stored as text[] in MVP.
    -- TODO (post-MVP): migrate to join table once stores migration exists.
    preferred_store_names text[]                NOT NULL DEFAULT '{}',
    created_at            timestamptz           NOT NULL DEFAULT now(),
    updated_at            timestamptz           NOT NULL DEFAULT now()
);


-- TRIGGERS

-- Reuse touch_updated_at defined in 0001_collaborative_lists_core.sql.
-- The function already exists; we only add the triggers.

DROP TRIGGER IF EXISTS trg_touch_profiles ON public.profiles;
CREATE TRIGGER trg_touch_profiles
    BEFORE UPDATE
    ON public.profiles
    FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_user_preferences ON public.user_preferences;
CREATE TRIGGER trg_touch_user_preferences
    BEFORE UPDATE
    ON public.user_preferences
    FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- AUTO-CREATE PROFILE ON SIGN-UP
-- Fires after a new row is inserted into auth.users.
-- Guarantees every authenticated user has a profile row with no manual step.
CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id,
               -- Use the name from raw_user_meta_data if the client sent it
               -- (e.g. from the register form field "Nombre visible").
               -- Falls back to empty string; the user can set it later.
            COALESCE(btrim(NEW.raw_user_meta_data ->> 'display_name'), ''))
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();