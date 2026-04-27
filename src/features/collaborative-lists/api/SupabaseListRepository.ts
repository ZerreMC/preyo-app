import type {SupabaseClient} from '@supabase/supabase-js';

import {
    ShoppingList,
    type ListStatusValue,
    type Snapshot,
    type Uuid,
} from '../domain/ShoppingList';
import {
    type AddItemParams,
    type ChangeStatusParams,
    type ListRepository,
    type RemoveItemParams,
    type ToggleItemParams,
    RepositoryError,
    type RepositoryErrorCode,
} from '../model/ports/ListRepository';

type ShoppingListRow = {
    id: string;
    owner_id: string;
    title: string;
    status: ListStatusValue;
    transport_capacity_g: number;
};

type ShoppingListItemRow = {
    id: string;
    list_id: string;
    product_ref: string;
    name: string;
    quantity: string | null;
    estimated_weight_g: number;
    checked: boolean;
};

function mapRpcErrorCode(message: string): RepositoryErrorCode {
    switch (message) {
        case 'UNAUTHORIZED':
            return 'UNAUTHORIZED';
        case 'FORBIDDEN':
            return 'FORBIDDEN';
        case 'NOT_FOUND':
            return 'NOT_FOUND';
        case 'LIST_LOCKED':
            return 'LIST_LOCKED';
        case 'DUPLICATE_PRODUCT':
            return 'DUPLICATE_PRODUCT';
        case 'CAPACITY_EXCEEDED':
            return 'CAPACITY_EXCEEDED';
        case 'ITEM_NOT_FOUND':
            return 'ITEM_NOT_FOUND';
        case 'INVALID_STATUS_TRANSITION':
            return 'INVALID_STATUS_TRANSITION';
        default:
            return 'INVALID_INPUT';
    }
}

export class SupabaseListRepository implements ListRepository {
    constructor(private readonly supabase: SupabaseClient) {
    }

    async getByIdForWrite(listId: Uuid): Promise<ShoppingList | null> {
        const {data: listRow, error: listError} = await this.supabase
            .from('shopping_lists')
            .select('id, owner_id, title, status, transport_capacity_g, items:shopping_list_items(id, list_id, product_ref, name, quantity, estimated_weight_g, checked)')
            .eq('id', listId)
            .maybeSingle<ShoppingListRow & { items: ShoppingListItemRow[] }>();

        if (listError) {
            throw new RepositoryError('INVALID_INPUT', listError.message);
        }

        if (!listRow) {
            return null;
        }

        const snapshot: Snapshot = {
            id: listRow.id as Uuid,
            ownerId: listRow.owner_id as Uuid,
            title: listRow.title,
            status: listRow.status,
            transportCapacityG: listRow.transport_capacity_g,
            items: (listRow.items ?? []).map((row: ShoppingListItemRow) => ({
                id: row.id as Uuid,
                productRef: row.product_ref,
                name: row.name,
                quantity: row.quantity,
                estimatedWeightG: row.estimated_weight_g,
                checked: row.checked,
            })),
        };

        return ShoppingList.hydrate(snapshot);
    }

    async addItem(params: AddItemParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_add_item', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_item_id: params.itemId,
            p_product_ref: params.productRef,
            p_name: params.name,
            p_quantity: params.quantity,
            p_estimated_weight_g: params.estimatedWeightG,
        });

        if (error) {
            throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
        }
    }

    async removeItem(params: RemoveItemParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_remove_item', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_item_id: params.itemId,
        });

        if (error) {
            throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
        }
    }

    async toggleItem(params: ToggleItemParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_toggle_item', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_item_id: params.itemId,
            p_checked: params.checked,
        });

        if (error) {
            throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
        }
    }

    async changeStatus(params: ChangeStatusParams): Promise<void> {
        const {error} = await this.supabase.rpc('cl_change_status', {
            p_command_id: params.commandId,
            p_list_id: params.listId,
            p_next_status: params.nextStatus,
        });

        if (error) {
            throw new RepositoryError(mapRpcErrorCode(error.message), error.message);
        }
    }
}