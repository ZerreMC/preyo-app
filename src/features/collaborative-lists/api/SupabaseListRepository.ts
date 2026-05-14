import type {SupabaseClient} from '@supabase/supabase-js';

import {
    ShoppingList,
    type Snapshot,
    type Uuid,
} from '../domain/ShoppingList';
import {
    type AddItemParams,
    type ChangeStatusParams,
    type CollaboratorRole,
    type CreateListParams,
    type DeleteListParams,
    type ListCollaborator,
    type ListRepository,
    type PendingListInvite,
    type RemoveItemParams,
    type RenameListParams,
    type ShoppingListSummary,
    type ToggleItemParams,
    RepositoryError,
    type RepositoryErrorCode,
} from '../model/ports/ListRepository';
import type {Database} from '@/shared/api/supabase/types/database.types';

type PreyoSupabaseClient = SupabaseClient<Database>;
type ShoppingListRow = Database['public']['Tables']['shopping_lists']['Row'];
type ShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row'];
type CollaboratorRow = Database['public']['Tables']['shopping_list_collaborators']['Row'];
type PendingInviteRow = Database['public']['Tables']['shopping_list_invites']['Row'];

type ListWithItemsRow = ShoppingListRow & {
    items: Pick<
        ShoppingListItemRow,
        'id' | 'list_id' | 'product_ref' | 'name' | 'quantity' | 'estimated_weight_g' | 'checked'
    >[];
};

// Profile data joined from profiles table
type CollaboratorProfile = {
    display_name: string;
    avatar_url: string | null;
} | null;

type CollaboratorWithProfile = Pick<CollaboratorRow, 'user_id' | 'role' | 'can_invite'> & {
    profile: CollaboratorProfile;
};

type ListSummaryRow = Pick<ShoppingListRow, 'id' | 'title' | 'status' | 'updated_at'> & {
    items: Pick<ShoppingListItemRow, 'id' | 'checked'>[];
    collaborators: CollaboratorWithProfile[];
};

const avatarColors = ['#39B86B', '#FF8A3D', '#3347C4', '#8B5CF6', '#C94F45'];

function mapRpcErrorCode(message: string): RepositoryErrorCode {
    if (message.includes('UNAUTHORIZED')) return 'UNAUTHORIZED';
    if (message.includes('FORBIDDEN')) return 'FORBIDDEN';
    if (message.includes('USER_NOT_FOUND')) return 'USER_NOT_FOUND';
    if (message.includes('OWNER_PROTECTED')) return 'OWNER_PROTECTED';
    if (message.includes('LIMIT_REACHED')) return 'LIMIT_REACHED';
    if (message.includes('ALREADY_MEMBER')) return 'ALREADY_MEMBER';
    if (message.includes('INVITE_PENDING')) return 'INVITE_PENDING';
    if (message.includes('INVALID_EMAIL')) return 'INVALID_EMAIL';
    if (message.includes('INVITE_REVOKED')) return 'INVITE_REVOKED';
    if (message.includes('INVITE_USED')) return 'INVITE_USED';
    if (message.includes('INVITE_EXPIRED')) return 'INVITE_EXPIRED';
    if (message.includes('NOT_FOUND')) return 'NOT_FOUND';
    if (message.includes('LIST_LOCKED')) return 'LIST_LOCKED';
    if (message.includes('DUPLICATE_PRODUCT')) return 'DUPLICATE_PRODUCT';
    if (message.includes('CAPACITY_EXCEEDED')) return 'CAPACITY_EXCEEDED';
    if (message.includes('ITEM_NOT_FOUND')) return 'ITEM_NOT_FOUND';
    if (message.includes('INVALID_STATUS_TRANSITION')) return 'INVALID_STATUS_TRANSITION';
    return 'INVALID_INPUT';
}

function mapListToSnapshot(listRow: ListWithItemsRow): Snapshot {
    return {
        id: listRow.id as Uuid,
        ownerId: listRow.owner_id as Uuid,
        title: listRow.title,
        status: listRow.status,
        transportCapacityG: listRow.transport_capacity_g,
        items: (listRow.items ?? []).map((row) => ({
            id: row.id as Uuid,
            productRef: row.product_ref,
            name: row.name,
            quantity: row.quantity,
            estimatedWeightG: row.estimated_weight_g,
            checked: row.checked,
        })),
    };
}

function collaboratorColor(userId: string) {
    const index = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarColors.length;
    return avatarColors[index];
}

function mapCollaborator(row: CollaboratorWithProfile): ListCollaborator {
    const displayName = row.profile?.display_name?.trim() || null;
    const initials = displayName
        ? displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        : row.user_id.slice(0, 2).toUpperCase();

    return {
        id: row.user_id as Uuid,
        role: row.role as CollaboratorRole,
        canInvite: row.role === 'OWNER' || row.can_invite,
        name: displayName ?? `Usuario ${row.user_id.slice(0, 8)}`,
        initials,
        color: collaboratorColor(row.user_id),
    };
}

function mapPendingInvite(row: PendingInviteRow): PendingListInvite {
    return {
        id: row.id as Uuid,
        email: row.email,
        role: row.role as Exclude<CollaboratorRole, 'OWNER'>,
        canInvite: row.can_invite,
        expiresAt: row.expires_at,
        usedAt: row.used_at,
        revokedAt: row.revoked_at,
        createdAt: row.created_at,
    };
}

export class SupabaseListRepository implements ListRepository {
    constructor(private readonly supabase: PreyoSupabaseClient) {
    }

    async getList(listId: Uuid): Promise<ShoppingList | null> {
        return this.getByIdForWrite(listId);
    }

    async getLists(): Promise<ShoppingListSummary[]> {
        const {data, error} = await this.supabase
            .from('shopping_lists')
            .select(`
                id, title, status, updated_at,
                items:shopping_list_items(id, checked),
                collaborators:shopping_list_collaborators(
                    user_id,
                    role,
                    can_invite,
                    profile:profiles(display_name, avatar_url)
                )
            `)
            .order('updated_at', {ascending: false})
            .returns<ListSummaryRow[]>();

        if (error) {
            throw new RepositoryError('INVALID_INPUT', error.message);
        }

        return (data ?? []).map((row) => ({
            id: row.id as Uuid,
            title: row.title,
            status: row.status,
            itemCount: row.items.length,
            checkedCount: row.items.filter((item) => item.checked).length,
            collaborators: row.collaborators.map(mapCollaborator),
            updatedAt: row.updated_at,
        }));
    }

    async getByIdForWrite(listId: Uuid): Promise<ShoppingList | null> {
        const {data: listRow, error: listError} = await this.supabase
            .from('shopping_lists')
            .select(`
                id, owner_id, title, status, transport_capacity_g, last_command_id, last_command_at, created_at, updated_at,
                items:shopping_list_items(id, list_id, product_ref, name, quantity, estimated_weight_g, checked)
            `)
            .eq('id', listId)
            .returns<ListWithItemsRow[]>()
            .maybeSingle();

        if (listError) {
            throw new RepositoryError('INVALID_INPUT', listError.message);
        }

        if (!listRow) return null;

        return ShoppingList.hydrate(mapListToSnapshot(listRow));
    }

    async createList(params: CreateListParams): Promise<ShoppingList> {
        const {error} = await this.supabase.rpc('cl_create_list', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_title: params.title,
            p_transport_capacity_g: params.transportCapacityG,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);

        const list = await this.getList(params.listId);
        if (!list) throw new RepositoryError('NOT_FOUND');

        return list;
    }

    async renameList(params: RenameListParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_rename_list', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_title: params.title,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async deleteList(params: DeleteListParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_delete_list', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async addItem(params: AddItemParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_add_item', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_item_id: params.itemId,
            p_product_ref: params.productRef,
            p_name: params.name,
            p_quantity: params.quantity ?? '',
            p_estimated_weight_g: params.estimatedWeightG,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async removeItem(params: RemoveItemParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_remove_item', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_item_id: params.itemId,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async toggleItem(params: ToggleItemParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_toggle_item', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_item_id: params.itemId,
            p_checked: params.checked,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async changeStatus(params: ChangeStatusParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_change_status', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_next_status: params.nextStatus,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async getCollaborators(listId: Uuid): Promise<ListCollaborator[]> {
        const {data, error} = await this.supabase
            .from('shopping_list_collaborators')
            .select(`
                user_id,
                role,
                can_invite,
                profile:profiles(display_name, avatar_url)
            `)
            .eq('list_id', listId)
            .returns<CollaboratorWithProfile[]>();

        if (error) throw new RepositoryError('INVALID_INPUT', error.message);

        return (data ?? []).map(mapCollaborator);
    }

    async addCollaboratorByEmail(
        listId: Uuid,
        email: string,
        role: Exclude<CollaboratorRole, 'OWNER'>,
        canInvite = false,
    ): Promise<string> {
        const {data, error} = await this.supabase.rpc('cl_generate_invite_token', {
            p_list_id: listId,
            p_email: email,
            p_role: role,
            p_can_invite: canInvite,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);

        return data;
    }

    async removeCollaborator(listId: Uuid, userId: Uuid): Promise<void> {
        const {error} = await this.supabase.rpc('cl_remove_collaborator', {
            p_list_id: listId,
            p_target_user_id: userId,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async generateInviteToken(
        listId: Uuid,
        role: Exclude<CollaboratorRole, 'OWNER'> = 'EDITOR',
        canInvite = false,
    ): Promise<string> {
        const {data, error} = await this.supabase.rpc('cl_generate_invite_token', {
            p_list_id: listId,
            p_role: role,
            p_email: null,
            p_can_invite: canInvite,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);

        return data;
    }

    async acceptInvite(token: string): Promise<Uuid> {
        const {data, error} = await this.supabase.rpc('cl_accept_invite', {
            p_token: token,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);

        return data as Uuid;
    }

    async getPendingInvites(listId: Uuid): Promise<PendingListInvite[]> {
        const {data, error} = await this.supabase
            .from('shopping_list_invites')
            .select('id, list_id, email, role, can_invite, token_hash, expires_at, used_at, revoked_at, created_by, created_at')
            .eq('list_id', listId)
            .is('used_at', null)
            .is('revoked_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', {ascending: false})
            .returns<PendingInviteRow[]>();

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);

        return (data ?? []).map(mapPendingInvite);
    }

    async revokeInvite(inviteId: Uuid): Promise<void> {
        const {error} = await this.supabase.rpc('cl_revoke_invite', {
            p_invite_id: inviteId,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }

    async updateCollaboratorCanInvite(listId: Uuid, userId: Uuid, canInvite: boolean): Promise<void> {
        const {error} = await this.supabase.rpc('cl_update_collaborator_invite_permission', {
            p_list_id: listId,
            p_target_user_id: userId,
            p_can_invite: canInvite,
        });

        if (error) throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
    }
}
