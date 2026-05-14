"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createClient} from "@/shared/api/supabase/browserClient";
import {SupabaseNotificationsRepository} from "../../api/SupabaseNotificationsRepository";
import type {AppNotification, NotificationActionResult, NotificationsState} from "../types";

type ToastPayload = {
    kind: "success" | "error" | "info";
    message: string;
};

export function useNotifications() {
    const supabase = useMemo(() => createClient(), []);
    const repository = useMemo(() => new SupabaseNotificationsRepository(supabase), [supabase]);
    const [state, setState] = useState<NotificationsState>({
        notifications: [],
        unreadCount: 0,
        loading: true,
        error: null,
    });
    const [actingId, setActingId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastPayload | null>(null);
    const actionLockRef = useRef<string | null>(null);
    const toastTimerRef = useRef<number | null>(null);

    const showToast = useCallback((payload: ToastPayload) => {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        setToast(payload);
        toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
    }, []);

    const refresh = useCallback(async () => {
        setState((current) => ({...current, loading: true, error: null}));

        try {
            const notifications = await repository.getRecent();
            setState({
                notifications,
                unreadCount: notifications.filter((notification) => !notification.readAt).length,
                loading: false,
                error: null,
            });
        } catch (error) {
            setState((current) => ({
                ...current,
                loading: false,
                error: error instanceof Error ? error.message : "No se pudieron cargar las notificaciones.",
            }));
        }
    }, [repository]);

    useEffect(() => {
        void refresh();

        return () => {
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        };
    }, [refresh]);

    // Realtime subscription: refresh when a new notification is broadcast to this user's channel
    useEffect(() => {
        let isMounted = true;
        let channel: ReturnType<SupabaseClient["channel"]> | null = null;

        supabase.auth.getUser().then(({data}) => {
            const userId = data.user?.id;
            if (!userId || !isMounted) return;

            supabase.auth.getSession().then(({data: sessionData}) => {
                if (!isMounted) return;

                void supabase.realtime.setAuth(sessionData.session?.access_token ?? null);

                channel = supabase
                    .channel(`notifications:${userId}`, {config: {private: true}})
                    .on("broadcast", {event: "INSERT"}, () => {
                        if (isMounted) void refresh();
                    })
                    .subscribe();
            });
        });

        return () => {
            isMounted = false;
            if (channel) void supabase.removeChannel(channel);
        };
    }, [supabase, refresh]);

    const markAllRead = useCallback(async () => {
        if (state.unreadCount === 0) return;

        setState((current) => ({
            ...current,
            unreadCount: 0,
            notifications: current.notifications.map((notification) => ({
                ...notification,
                readAt: notification.readAt ?? new Date().toISOString(),
            })),
        }));

        try {
            await repository.markAllRead();
        } catch {
            void refresh();
        }
    }, [refresh, repository, state.unreadCount]);

    const markRead = useCallback(async (notificationId: string) => {
        setState((current) => ({
            ...current,
            notifications: current.notifications.map((notification) =>
                notification.id === notificationId
                    ? {...notification, readAt: notification.readAt ?? new Date().toISOString()}
                    : notification,
            ),
            unreadCount: current.notifications.filter(
                (notification) => notification.id !== notificationId && !notification.readAt,
            ).length,
        }));

        try {
            await repository.markRead(notificationId);
        } catch {
            void refresh();
        }
    }, [refresh, repository]);

    const runInviteAction = useCallback(async (
        notification: AppNotification,
        action: "accept" | "reject",
    ): Promise<NotificationActionResult> => {
        if (!notification.invite.id) {
            const message = "La invitación ya no está disponible.";
            showToast({kind: "error", message});
            return {ok: false, message};
        }

        if (actionLockRef.current === notification.id) {
            const message = "Espera unos segundos antes de volver a intentarlo.";
            showToast({kind: "info", message});
            return {ok: false, message};
        }

        actionLockRef.current = notification.id;
        setActingId(notification.id);

        try {
            if (action === "accept") {
                await repository.acceptInvite(notification.invite.id);
                showToast({kind: "success", message: "Invitación aceptada"});
            } else {
                await repository.rejectInvite(notification.invite.id);
                showToast({kind: "success", message: "Invitación rechazada"});
            }

            await refresh();
            return {ok: true};
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo completar la acción.";
            showToast({kind: "error", message});
            await refresh();
            return {ok: false, message};
        } finally {
            actionLockRef.current = null;
            setActingId(null);
        }
    }, [refresh, repository, showToast]);

    return {
        ...state,
        actingId,
        toast,
        refresh,
        markAllRead,
        markRead,
        acceptInvite: (notification: AppNotification) => runInviteAction(notification, "accept"),
        rejectInvite: (notification: AppNotification) => runInviteAction(notification, "reject"),
    };
}
