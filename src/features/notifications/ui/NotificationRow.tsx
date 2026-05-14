"use client";

import {Check, X} from "lucide-react";
import {Avatar, Button} from "@/shared/ui";
import {cn, formatRelativeTime} from "@/shared/lib";
import type {AppNotification} from "../model/types";

type NotificationRowProps = {
    notification: AppNotification;
    acting: boolean;
    onAccept: (notification: AppNotification) => void;
    onReject: (notification: AppNotification) => void;
    onRead: (notificationId: string) => void;
};

const roleLabels = {
    EDITOR: "editor",
    VIEWER: "solo lectura",
} as const;

function canAct(notification: AppNotification) {
    return (
        notification.type === "list_invite_received" &&
        !notification.resolvedAt &&
        !notification.invite.usedAt &&
        !notification.invite.revokedAt &&
        Boolean(notification.invite.id)
    );
}

export function NotificationRow({
                                    notification,
                                    acting,
                                    onAccept,
                                    onReject,
                                    onRead,
                                }: NotificationRowProps) {
    const pendingAction = canAct(notification);
    const role = notification.invite.role ? roleLabels[notification.invite.role] : null;
    const listTitle = notification.list.title ?? notification.body;

    return (
        <article
            className={cn(
                "group relative flex gap-3 rounded-3xl px-3 py-3 transition-colors motion-reduce:transition-none",
                notification.readAt ? "bg-transparent" : "bg-[rgba(57,184,107,0.08)]",
                "hover:bg-bg-hover",
            )}
        >
            <Avatar
                src={notification.actor.avatarUrl ?? undefined}
                initials={notification.actor.initials}
                alt={notification.actor.name}
                size="lg"
                color="var(--color-brand)"
            />

            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => onRead(notification.id)}
                >
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug text-text-primary">
                                {notification.title}
                            </p>
                            {listTitle ? (
                                <p className="mt-0.5 truncate text-sm text-text-muted">
                                    {listTitle}
                                </p>
                            ) : null}
                        </div>

                        {!notification.readAt ? (
                            <span
                                aria-label="No leída"
                                className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                            />
                        ) : null}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <span>{formatRelativeTime(notification.createdAt)}</span>
                        {role ? (
                            <span className="rounded-full bg-bg-soft px-2 py-0.5 font-medium text-text-secondary">
                                {role}
                            </span>
                        ) : null}
                    </div>
                </button>

                {pendingAction ? (
                    <div className="mt-3 flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="min-h-8 px-3 text-xs"
                            loading={acting}
                            disabled={acting}
                            leftIcon={<Check size={14}/>}
                            onClick={() => onAccept(notification)}
                        >
                            Aceptar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-8 px-3 text-xs"
                            disabled={acting}
                            leftIcon={<X size={14}/>}
                            onClick={() => onReject(notification)}
                        >
                            Rechazar
                        </Button>
                    </div>
                ) : null}
            </div>
        </article>
    );
}
