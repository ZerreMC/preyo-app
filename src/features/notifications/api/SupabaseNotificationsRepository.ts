import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "@/shared/api/supabase/types/database.types";
import type {AppNotification, NotificationRole} from "../model/types";

type PreyoSupabaseClient = SupabaseClient<Database>;
type NotificationRow = Database["public"]["Functions"]["notifications_get_my_recent"]["Returns"][number];

function initialsFromName(name: string): string {
    const clean = name.trim();
    if (!clean) return "?";

    return clean
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";
}

function mapRole(role: string | null): NotificationRole | null {
    return role === "EDITOR" || role === "VIEWER" ? role : null;
}

function mapError(message: string): string {
    if (message.includes("UNAUTHORIZED")) return "Sesión expirada. Vuelve a iniciar sesión.";
    if (message.includes("FORBIDDEN")) return "No tienes permisos para realizar esta acción.";
    if (message.includes("NOT_FOUND")) return "La invitación ya no está disponible.";
    if (message.includes("INVITE_EXPIRED")) return "Esta invitación ha caducado.";
    if (message.includes("INVITE_USED")) return "Esta invitación ya fue usada.";
    if (message.includes("INVITE_REVOKED")) return "Esta invitación fue cancelada.";
    if (message.includes("ALREADY_MEMBER")) return "Ya formas parte de esta lista.";
    if (message.includes("LIMIT_REACHED")) return "Se alcanzó el límite de colaboradores.";
    return "No se pudo completar la acción. Inténtalo de nuevo.";
}

function mapNotification(row: NotificationRow): AppNotification {
    const actorName = row.actor_display_name?.trim() || "Alguien";

    return {
        id: row.id,
        type: row.type as AppNotification["type"],
        title: row.title,
        body: row.body,
        metadata: row.metadata,
        readAt: row.read_at,
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
        actor: {
            id: row.actor_id,
            name: actorName,
            avatarUrl: row.actor_avatar_url,
            initials: initialsFromName(actorName),
        },
        list: {
            id: row.list_id,
            title: row.list_title ?? row.body,
        },
        invite: {
            id: row.invite_token_id,
            role: mapRole(row.invite_role),
            email: row.invite_email,
            expiresAt: row.invite_expires_at,
            usedAt: row.invite_used_at,
            revokedAt: row.invite_revoked_at,
        },
    };
}

export class SupabaseNotificationsRepository {
    constructor(private readonly supabase: PreyoSupabaseClient) {
    }

    async getRecent(limit = 20): Promise<AppNotification[]> {
        const {data, error} = await this.supabase.rpc("notifications_get_my_recent", {
            p_limit: limit,
        });

        if (error) throw new Error(mapError(error.message));

        return (data ?? []).map(mapNotification);
    }

    async markRead(notificationId: string): Promise<void> {
        const {error} = await this.supabase.rpc("notifications_mark_read", {
            p_notification_id: notificationId,
        });

        if (error) throw new Error(mapError(error.message));
    }

    async markAllRead(): Promise<void> {
        const {error} = await this.supabase.rpc("notifications_mark_all_read");

        if (error) throw new Error(mapError(error.message));
    }

    async acceptInvite(inviteId: string): Promise<void> {
        const {error} = await this.supabase.rpc("cl_accept_invite_by_id", {
            p_invite_id: inviteId,
        });

        if (error) throw new Error(mapError(error.message));
    }

    async rejectInvite(inviteId: string): Promise<void> {
        const {error} = await this.supabase.rpc("cl_reject_invite_by_id", {
            p_invite_id: inviteId,
        });

        if (error) throw new Error(mapError(error.message));
    }
}
