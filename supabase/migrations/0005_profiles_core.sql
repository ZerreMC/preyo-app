-- Core schema for user profiles and onboarding preferences.

-- TYPES
DO $$ BEGIN
    CREATE TYPE public.transport_mode AS ENUM ('foot', 'car', 'public_transport');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.load_capacity AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.main_goal AS ENUM ('save_money', 'save_time', 'organize');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABLES

-- profiles: one row per auth.users, created via trigger on sign-up.
CREATE TABLE IF NOT EXISTS public.profiles
(
    id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name    text        NOT NULL DEFAULT '',
    avatar_url      text        NULL,
    onboarding_done boolean     NOT NULL DEFAULT false,
    email_public    boolean     NOT NULL DEFAULT false,
    locale          text        NOT NULL DEFAULT 'es'
                                CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
    timezone        text        NOT NULL DEFAULT 'Europe/Madrid',
    currency        text        NOT NULL DEFAULT 'EUR'
                                CHECK (currency ~ '^[A-Z]{3}$'),
    plan            text        NOT NULL DEFAULT 'basic'
                                CHECK (plan IN ('basic', 'premium')),
    plan_expires_at timestamptz NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- user_preferences: optional, created only on onboarding completion.
-- Decoupled from profiles so skipping onboarding never leaves a half-filled row.
CREATE TABLE IF NOT EXISTS public.user_preferences
(
    user_id               uuid                  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    postal_code           text                  NULL,
    transport_mode        public.transport_mode NULL,
    load_capacity         public.load_capacity  NULL,
    main_goal             public.main_goal      NULL,
    -- TODO post-MVP: migrate to join table once stores migration exists
    preferred_store_names text[]                NOT NULL DEFAULT '{}',
    created_at            timestamptz           NOT NULL DEFAULT now(),
    updated_at            timestamptz           NOT NULL DEFAULT now()
);

-- TRIGGERS

DROP TRIGGER IF EXISTS trg_touch_profiles ON public.profiles;
CREATE TRIGGER trg_touch_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_user_preferences ON public.user_preferences;
CREATE TRIGGER trg_touch_user_preferences
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AUTO-CREATE PROFILE ON SIGN-UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, locale, timezone)
    VALUES (
        NEW.id,
        COALESCE(btrim(NEW.raw_user_meta_data ->> 'display_name'), ''),
        COALESCE(
            CASE
                WHEN (NEW.raw_user_meta_data ->> 'locale') ~ '^[a-z]{2}(-[A-Z]{2})?$'
                    THEN NEW.raw_user_meta_data ->> 'locale'
                ELSE NULL
            END,
            'es'
        ),
        COALESCE(
            NULLIF(btrim(COALESCE(NEW.raw_user_meta_data ->> 'timezone', '')), ''),
            'Europe/Madrid'
        )
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
