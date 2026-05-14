-- =============================================================
-- Migration: 0018_notifications_core.sql
-- Description: Internal notifications for collaborative list invitations
-- =============================================================

CREATE SCHEMA IF NOT EXISTS security;

CREATE TABLE IF NOT EXISTS public.notifications
(
    id              uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    recipient_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    actor_id        uuid        NULL REFERENCES auth.users (id) ON DELETE SET NULL,
    list_id         uuid        NULL REFERENCES public.shopping_lists (id) ON DELETE CASCADE,
    invite_token_id uuid        NULL REFERENCES public.shopping_list_invites (id) ON DELETE SET NULL,
    type            text        NOT NULL CHECK (type IN (
                                                         'list_invite_received',
                                                         'list_invite_accepted',
                                                         'list_invite_rejected'
        )),
    title           text        NOT NULL,
    body            text        NULL,
    metadata        jsonb       NOT NULL DEFAULT '{}'::jsonb,
    read_at         timestamptz NULL,
    resolved_at     timestamptz NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_notifications_recipient_created
    ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_notifications_recipient_unread
    ON public.notifications (recipient_id, read_at)
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_notifications_invite_token
    ON public.notifications (invite_token_id)
    WHERE invite_token_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_recipient_invite_type
    ON public.notifications (recipient_id, invite_token_id, type)
    WHERE invite_token_id IS NOT NULL;

ALTER TABLE public.notifications
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
    FOR SELECT TO authenticated
    USING (recipient_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
    FOR UPDATE TO authenticated
    USING (recipient_id = (SELECT auth.uid()))
    WITH CHECK (recipient_id = (SELECT auth.uid()));

REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at, resolved_at) ON public.notifications TO authenticated;

CREATE OR REPLACE FUNCTION security.notification_user_label(p_user_id uuid)
    RETURNS text
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth
AS
$$
SELECT COALESCE(NULLIF(btrim(p.display_name), ''), u.email, 'Someone')
FROM auth.users u
         LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id = p_user_id
LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION security.notification_resolve_invite_received(
    p_recipient_id uuid,
    p_invite_id uuid
)
    RETURNS void
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS
$$
UPDATE public.notifications
SET read_at     = COALESCE(read_at, now()),
    resolved_at = COALESCE(resolved_at, now())
WHERE recipient_id = p_recipient_id
  AND invite_token_id = p_invite_id
  AND type = 'list_invite_received'
  AND resolved_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION security.notification_create_invite_received()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security
AS
$$
DECLARE
    v_recipient_id uuid;
    v_actor_label  text;
    v_list_title   text;
BEGIN
    IF NEW.email IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT id
    INTO v_recipient_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF v_recipient_id IS NULL OR v_recipient_id = NEW.created_by THEN
        RETURN NEW;
    END IF;

    IF EXISTS (SELECT 1
               FROM public.shopping_list_collaborators
               WHERE list_id = NEW.list_id
                 AND user_id = v_recipient_id) THEN
        RETURN NEW;
    END IF;

    SELECT title
    INTO v_list_title
    FROM public.shopping_lists
    WHERE id = NEW.list_id;

    v_actor_label := COALESCE(security.notification_user_label(NEW.created_by), 'Someone');

    INSERT INTO public.notifications (recipient_id,
                                      actor_id,
                                      list_id,
                                      invite_token_id,
                                      type,
                                      title,
                                      body,
                                      metadata)
    VALUES (v_recipient_id,
            NEW.created_by,
            NEW.list_id,
            NEW.id,
            'list_invite_received',
            v_actor_label || ' te invitó a colaborar',
            v_list_title,
            jsonb_build_object(
                    'role', NEW.role,
                    'can_invite', NEW.can_invite,
                    'email', NEW.email,
                    'list_title', v_list_title,
                    'actor_name', v_actor_label
            ))
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_invite_received ON public.shopping_list_invites;
CREATE TRIGGER trg_notifications_invite_received
    AFTER INSERT
    ON public.shopping_list_invites
    FOR EACH ROW
EXECUTE FUNCTION security.notification_create_invite_received();

CREATE OR REPLACE FUNCTION security.notification_after_invite_accepted()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security
AS
$$
DECLARE
    v_actor_id    uuid := auth.uid();
    v_actor_label text;
    v_list_title  text;
BEGIN
    IF OLD.used_at IS NOT NULL OR NEW.used_at IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_actor_id IS NOT NULL THEN
        PERFORM security.notification_resolve_invite_received(v_actor_id, NEW.id);
    END IF;

    IF v_actor_id IS NULL OR v_actor_id = NEW.created_by THEN
        RETURN NEW;
    END IF;

    SELECT title
    INTO v_list_title
    FROM public.shopping_lists
    WHERE id = NEW.list_id;

    v_actor_label := COALESCE(security.notification_user_label(v_actor_id), 'Someone');

    INSERT INTO public.notifications (recipient_id,
                                      actor_id,
                                      list_id,
                                      invite_token_id,
                                      type,
                                      title,
                                      body,
                                      metadata)
    VALUES (NEW.created_by,
            v_actor_id,
            NEW.list_id,
            NEW.id,
            'list_invite_accepted',
            v_actor_label || ' aceptó tu invitación',
            v_list_title,
            jsonb_build_object(
                    'role', NEW.role,
                    'list_title', v_list_title,
                    'actor_name', v_actor_label
            ))
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_invite_accepted ON public.shopping_list_invites;
CREATE TRIGGER trg_notifications_invite_accepted
    AFTER UPDATE OF used_at
    ON public.shopping_list_invites
    FOR EACH ROW
EXECUTE FUNCTION security.notification_after_invite_accepted();

CREATE OR REPLACE FUNCTION public.notifications_get_my_recent(p_limit integer DEFAULT 20)
    RETURNS TABLE
            (
                id                 uuid,
                recipient_id       uuid,
                actor_id           uuid,
                list_id            uuid,
                invite_token_id    uuid,
                type               text,
                title              text,
                body               text,
                metadata           jsonb,
                read_at            timestamptz,
                resolved_at        timestamptz,
                created_at         timestamptz,
                actor_display_name text,
                actor_avatar_url   text,
                list_title         text,
                invite_role        text,
                invite_email       text,
                invite_expires_at  timestamptz,
                invite_used_at     timestamptz,
                invite_revoked_at  timestamptz
            )
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth
AS
$$
SELECT n.id,
       n.recipient_id,
       n.actor_id,
       n.list_id,
       n.invite_token_id,
       n.type,
       n.title,
       n.body,
       n.metadata,
       n.read_at,
       n.resolved_at,
       n.created_at,
       p.display_name AS actor_display_name,
       p.avatar_url   AS actor_avatar_url,
       l.title        AS list_title,
       i.role         AS invite_role,
       i.email        AS invite_email,
       i.expires_at   AS invite_expires_at,
       i.used_at      AS invite_used_at,
       i.revoked_at   AS invite_revoked_at
FROM public.notifications n
         LEFT JOIN public.profiles p ON p.id = n.actor_id
         LEFT JOIN public.shopping_lists l ON l.id = n.list_id
         LEFT JOIN public.shopping_list_invites i ON i.id = n.invite_token_id
WHERE n.recipient_id = auth.uid()
ORDER BY n.created_at DESC
LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
$$;

CREATE OR REPLACE FUNCTION public.notifications_mark_read(p_notification_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth
AS
$$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    UPDATE public.notifications
    SET read_at = COALESCE(read_at, now())
    WHERE id = p_notification_id
      AND recipient_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.notifications_mark_all_read()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth
AS
$$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    UPDATE public.notifications
    SET read_at = COALESCE(read_at, now())
    WHERE recipient_id = auth.uid()
      AND read_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_accept_invite_by_id(p_invite_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security
AS
$$
DECLARE
    v_invite       record;
    v_user_email   text;
    v_collab_count integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF p_invite_id IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    SELECT *
    INTO v_invite
    FROM public.shopping_list_invites
    WHERE id = p_invite_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_invite.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_REVOKED';
    END IF;

    IF v_invite.used_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_USED';
    END IF;

    IF v_invite.expires_at <= now() THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_EXPIRED';
    END IF;

    IF v_invite.email IS NOT NULL THEN
        SELECT lower(email)
        INTO v_user_email
        FROM auth.users
        WHERE id = auth.uid();

        IF v_user_email IS DISTINCT FROM lower(v_invite.email) THEN
            RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
        END IF;
    END IF;

    IF EXISTS (SELECT 1
               FROM public.shopping_list_collaborators
               WHERE list_id = v_invite.list_id
                 AND user_id = auth.uid()) THEN
        RAISE EXCEPTION USING MESSAGE = 'ALREADY_MEMBER';
    END IF;

    SELECT COUNT(*)
    INTO v_collab_count
    FROM public.shopping_list_collaborators
    WHERE list_id = v_invite.list_id;

    IF v_collab_count >= 10 THEN
        RAISE EXCEPTION USING MESSAGE = 'LIMIT_REACHED';
    END IF;

    INSERT INTO public.shopping_list_collaborators (list_id,
                                                    user_id,
                                                    role,
                                                    can_invite,
                                                    invited_by,
                                                    joined_at)
    VALUES (v_invite.list_id,
            auth.uid(),
            v_invite.role,
            v_invite.can_invite,
            v_invite.created_by,
            now());

    UPDATE public.shopping_list_invites
    SET used_at = now()
    WHERE id = v_invite.id;

    RETURN v_invite.list_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_reject_invite_by_id(p_invite_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security
AS
$$
DECLARE
    v_invite      record;
    v_user_email  text;
    v_actor_label text;
    v_list_title  text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF p_invite_id IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    SELECT *
    INTO v_invite
    FROM public.shopping_list_invites
    WHERE id = p_invite_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    IF v_invite.used_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_USED';
    END IF;

    IF v_invite.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_REVOKED';
    END IF;

    IF v_invite.expires_at <= now() THEN
        RAISE EXCEPTION USING MESSAGE = 'INVITE_EXPIRED';
    END IF;

    IF v_invite.email IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    SELECT lower(email)
    INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();

    IF v_user_email IS DISTINCT FROM lower(v_invite.email) THEN
        RAISE EXCEPTION USING MESSAGE = 'FORBIDDEN';
    END IF;

    UPDATE public.shopping_list_invites
    SET revoked_at = now()
    WHERE id = v_invite.id;

    PERFORM security.notification_resolve_invite_received(auth.uid(), v_invite.id);

    SELECT title
    INTO v_list_title
    FROM public.shopping_lists
    WHERE id = v_invite.list_id;

    v_actor_label := COALESCE(security.notification_user_label(auth.uid()), 'Someone');

    IF auth.uid() <> v_invite.created_by THEN
        INSERT INTO public.notifications (recipient_id,
                                          actor_id,
                                          list_id,
                                          invite_token_id,
                                          type,
                                          title,
                                          body,
                                          metadata)
        VALUES (v_invite.created_by,
                auth.uid(),
                v_invite.list_id,
                v_invite.id,
                'list_invite_rejected',
                v_actor_label || ' rechazó tu invitación',
                v_list_title,
                jsonb_build_object(
                        'role', v_invite.role,
                        'list_title', v_list_title,
                        'actor_name', v_actor_label
                ))
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cl_reject_invite(p_token text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, auth, security, extensions
AS
$$
DECLARE
    v_invite_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION USING MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF btrim(COALESCE(p_token, '')) = '' THEN
        RAISE EXCEPTION USING MESSAGE = 'INVALID_INPUT';
    END IF;

    SELECT id
    INTO v_invite_id
    FROM public.shopping_list_invites
    WHERE token_hash = encode(extensions.digest(p_token, 'sha256'::text), 'hex');

    IF NOT FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'NOT_FOUND';
    END IF;

    PERFORM public.cl_reject_invite_by_id(v_invite_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_notification_changes()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public, realtime
AS
$$
BEGIN
    PERFORM realtime.broadcast_changes(
            'notifications:' || NEW.recipient_id::text,
            TG_OP,
            TG_OP,
            TG_TABLE_NAME,
            TG_TABLE_SCHEMA,
            NEW,
            OLD
            );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;
CREATE TRIGGER on_notification_insert
    AFTER INSERT
    ON public.notifications
    FOR EACH ROW
EXECUTE FUNCTION public.broadcast_notification_changes();

DROP POLICY IF EXISTS "realtime_messages_notifications" ON realtime.messages;
CREATE POLICY "realtime_messages_notifications" ON realtime.messages
    FOR SELECT TO authenticated
    USING (
    topic ~ '^notifications:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND split_part(topic, ':', 2)::uuid = (SELECT auth.uid())
    );

REVOKE ALL ON FUNCTION public.notifications_get_my_recent(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notifications_mark_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notifications_mark_all_read() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cl_accept_invite_by_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cl_reject_invite_by_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cl_reject_invite(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.notifications_get_my_recent(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notifications_mark_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notifications_mark_all_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_accept_invite_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_reject_invite_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cl_reject_invite(text) TO authenticated;

NOTIFY pgrst, 'reload schema';