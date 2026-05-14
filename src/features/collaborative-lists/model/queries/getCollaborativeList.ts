import type {SupabaseClient} from '@supabase/supabase-js';

import type {ListStatusValue, Uuid} from '../../domain/ShoppingList';
import type {CollaboratorRole} from '../ports/ListRepository';

export type CollaborativeListItemReadModel = {
    id: Uuid;
    productRef: string;
    name: string;
    quantity: string | null;
    estimatedWeightG: number;
    checked: boolean;
};

export type CollaborativeListReadModel = {
    id: Uuid;
    ownerId: Uuid;
    title: string;
    status: ListStatusValue;
    transportCapacityG: number;
    lastCommandId: Uuid | null;
    lastCommandAt: string | null;
    items: CollaborativeListItemReadModel[];
    currentUserRole: CollaboratorRole | null;
};

type ShoppingListItemRow = {
    id: string;
    product_ref: string;
    name: string;
    quantity: string | null;
    estimated_weight_g: number;
    checked: boolean;
};

type CollaboratorRow = {
    user_id: string;
    role: string;
};

type ShoppingListRow = {
    id: string;
    owner_id: string;
    title: string;
    status: string;
    transport_capacity_g: number;
    last_command_id: string | null;
    last_command_at: string | null;
    items: ShoppingListItemRow[];
    collaborators: CollaboratorRow[];
};

export async function getCollaborativeList(
    supabase: SupabaseClient,
    listId: Uuid,
): Promise<CollaborativeListReadModel | null> {
    const [{data, error}, {data: userData}] = await Promise.all([
        supabase
            .from('shopping_lists')
            .select(`
                id, owner_id, title, status, transport_capacity_g, last_command_id, last_command_at,
                items:shopping_list_items(id, product_ref, name, quantity, estimated_weight_g, checked),
                collaborators:shopping_list_collaborators(user_id, role)
            `)
            .eq('id', listId)
            .returns<ShoppingListRow[]>()
            .maybeSingle(),
        supabase.auth.getUser(),
    ]);

    if (error) throw error;
    if (!data) return null;

    const userId = userData?.user?.id ?? null;
    let currentUserRole: CollaboratorRole | null = null;

    if (userId) {
        if (data.owner_id === userId) {
            currentUserRole = 'OWNER';
        } else {
            const collab = (data.collaborators ?? []).find((c) => c.user_id === userId);
            currentUserRole = (collab?.role as CollaboratorRole) ?? null;
        }
    }

    return {
        id: data.id as Uuid,
        ownerId: data.owner_id as Uuid,
        title: data.title,
        status: data.status as ListStatusValue,
        transportCapacityG: data.transport_capacity_g,
        lastCommandId: data.last_command_id as Uuid | null,
        lastCommandAt: data.last_command_at,
        items: (data.items ?? []).map((row: ShoppingListItemRow) => ({
            id: row.id as Uuid,
            productRef: row.product_ref,
            name: row.name,
            quantity: row.quantity,
            estimatedWeightG: row.estimated_weight_g,
            checked: row.checked,
        })),
        currentUserRole,
    };
}