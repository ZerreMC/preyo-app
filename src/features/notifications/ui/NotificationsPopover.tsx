"use client";

import {Bell, Loader2, RefreshCw} from "lucide-react";
import {Button} from "@/shared/ui";
import {cn} from "@/shared/lib";
import {NotificationRow} from "./NotificationRow";
import type {AppNotification} from "../model/types";

type ToastPayload = {
    kind: "success" | "error" | "info";
    message: string;
};

type NotificationsPopoverProps = {
    open: boolean;
    notifications: AppNotification[];
    loading: boolean;
    error: string | null;
    actingId: string | null;
    toast: ToastPayload | null;
    onRefresh: () => void;
    onMarkAllRead: () => void;
    onMarkRead: (notificationId: string) => void;
    onAccept: (notification: AppNotification) => void;
    onReject: (notification: AppNotification) => void;
};

export function NotificationsPopover({
                                         open,
                                         notifications,
                                         loading,
                                         error,
                                         actingId,
                                         toast,
                                         onRefresh,
                                         onMarkAllRead,
                                         onMarkRead,
                                         onAccept,
                                         onReject,
                                     }: NotificationsPopoverProps) {
    if (!open) return null;

    return (
        <div
            className={cn(
                "absolute right-0 top-12 z-50 w-[min(calc(100vw-2rem),25rem)] overflow-hidden rounded-3xl border border-divider bg-white shadow-[0_20px_60px_rgba(24,24,27,0.16)]",
                "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-reduce:transition-none",
            )}
        >
            <div className="border-b border-divider px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-base font-bold text-text-primary">Notificaciones</p>
                        <p className="text-xs text-text-muted">Invitaciones y actividad reciente</p>
                    </div>

                    <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-full border border-divider text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary motion-reduce:transition-none"
                        aria-label="Actualizar notificaciones"
                        onClick={onRefresh}
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : undefined}/>
                    </button>
                </div>

                {notifications.some((notification) => !notification.readAt) ? (
                    <button
                        type="button"
                        className="mt-3 text-xs font-semibold text-brand hover:text-brand-active"
                        onClick={onMarkAllRead}
                    >
                        Marcar todo como leído
                    </button>
                ) : null}
            </div>

            <div className="max-h-[min(68vh,31rem)] overflow-y-auto p-2">
                {loading ? <LoadingState/> : null}
                {!loading && error ? <ErrorState message={error} onRetry={onRefresh}/> : null}
                {!loading && !error && notifications.length === 0 ? <EmptyState/> : null}
                {!loading && !error && notifications.length > 0 ? (
                    <div className="space-y-1">
                        {notifications.map((notification) => (
                            <NotificationRow
                                key={notification.id}
                                notification={notification}
                                acting={actingId === notification.id}
                                onAccept={onAccept}
                                onReject={onReject}
                                onRead={onMarkRead}
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            {toast ? <Toast payload={toast}/> : null}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <Loader2 size={22} className="animate-spin text-brand"/>
            <p className="text-sm font-medium text-text-muted">Cargando notificaciones...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-bg-soft text-text-muted">
                <Bell size={20}/>
            </div>
            <p className="text-sm font-semibold text-text-primary">Nada nuevo por aquí</p>
            <p className="mt-1 max-w-56 text-sm text-text-muted">
                Las invitaciones reales a tus listas aparecerán en este panel.
            </p>
        </div>
    );
}

function ErrorState({message, onRetry}: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-sm font-semibold text-error">{message}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
                Reintentar
            </Button>
        </div>
    );
}

function Toast({payload}: { payload: ToastPayload }) {
    const isError = payload.kind === "error";

    return (
        <div
            role={isError ? "alert" : undefined}
            aria-live={isError ? undefined : "polite"}
            className={cn(
                "pointer-events-none absolute inset-x-4 bottom-4 rounded-full px-4 py-3 text-center text-sm font-semibold shadow-[0_12px_32px_rgba(24,24,27,0.18)]",
                isError ? "bg-[#FFF0F0] text-error" : "bg-text-primary text-white",
            )}
        >
            {payload.message}
        </div>
    );
}
