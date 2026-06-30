-- DANGER / PELIGRO: destructive reset of the Preyo application schema.
--
-- Drops ALL Preyo objects (public + security schemas) and the migration history
-- (preyo_meta) so the current migration lineage can be re-applied from zero.
-- Does NOT touch Supabase-managed schemas (auth, storage, realtime, extensions),
-- so existing auth.users survive. The cascade also drops the auth.users trigger
-- (handle_new_user) and the realtime.messages policy that depend on our objects;
-- migrations 0004/0005 recreate them.
--
-- ONLY for the disposable preproduction LXC. Never run against production.
--
-- Run from the repo root:
--   ssh yisus@<LXC_HOST> "cd /opt/supabase/docker && docker compose exec -T db \
--     psql -U postgres -d postgres -v ON_ERROR_STOP=1" < scripts/db/reset-remote.sql

BEGIN;

DROP SCHEMA IF EXISTS preyo_meta CASCADE;
DROP SCHEMA IF EXISTS security CASCADE;
DROP SCHEMA IF EXISTS public CASCADE;

-- Recreate public with the standard Supabase grants.
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

COMMIT;
