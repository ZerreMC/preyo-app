import type {ListStatusValue, ShoppingList, Uuid} from '../../domain/ShoppingList';

export type RepositoryErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'LIST_LOCKED'
    | 'DUPLICATE_PRODUCT'
    | 'CAPACITY_EXCEEDED'
    | 'ITEM_NOT_FOUND'
    | 'INVALID_STATUS_TRANSITION'
    | 'INVALID_INPUT';

export class RepositoryError extends Error {
    constructor(
        public readonly code: RepositoryErrorCode,
        message?: string
    ) {
        super(message ?? code);
        this.name = 'RepositoryError';
    }
}

export type AddItemParams = {
    commandId: Uuid;
    listId: Uuid;
    itemId: Uuid;
    productRef: string;
    name: string;
    quantity: string | null;
    estimatedWeightG: number;
};

export type RemoveItemParams = {
    commandId: Uuid;
    listId: Uuid;
    itemId: Uuid;
};

export type ToggleItemParams = {
    commandId: Uuid;
    listId: Uuid;
    itemId: Uuid;
    checked: boolean;
};

export type ChangeStatusParams = {
    commandId: Uuid;
    listId: Uuid;
    nextStatus: ListStatusValue;
};

export interface ListRepository {
    getByIdForWrite(listId: Uuid): Promise<ShoppingList | null>;

    addItem(params: AddItemParams): Promise<void>;

    removeItem(params: RemoveItemParams): Promise<void>;

    toggleItem(params: ToggleItemParams): Promise<void>;

    changeStatus(params: ChangeStatusParams): Promise<void>;
}