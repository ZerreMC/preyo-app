import type {Json} from "@/shared/api/supabase/types/database.types";

export type NotificationType =
    | "list_invite_received"
    | "list_invite_accepted"
    | "list_invite_rejected";

export type NotificationRole = "EDITOR" | "VIEWER";

export type AppNotification = {
    id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    metadata: Json;
    readAt: string | null;
    resolvedAt: string | null;
    createdAt: string;
    actor: {
        id: string | null;
        name: string;
        avatarUrl: string | null;
        initials: string;
    };
    list: {
        id: string | null;
        title: string | null;
    };
    invite: {
        id: string | null;
        role: NotificationRole | null;
        email: string | null;
        expiresAt: string | null;
        usedAt: string | null;
        revokedAt: string | null;
    };
};

export type NotificationsState = {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
};

export type NotificationActionResult =
    | { ok: true }
    | { ok: false; message: string };
