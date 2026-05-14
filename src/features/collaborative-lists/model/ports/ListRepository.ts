import type {ListStatusValue, ShoppingList, Uuid} from '../../domain/ShoppingList';

export type RepositoryErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'USER_NOT_FOUND'
    | 'INVITE_USED'
    | 'INVITE_EXPIRED'
    | 'INVITE_REVOKED'
    | 'INVITE_PENDING'
    | 'ALREADY_MEMBER'
    | 'LIMIT_REACHED'
    | 'INVALID_EMAIL'
    | 'OWNER_PROTECTED'
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

export type CreateListParams = {
    commandId: Uuid;
    listId: Uuid;
    title: string;
    transportCapacityG: number;
};

export type RenameListParams = {
    commandId: Uuid;
    listId: Uuid;
    title: string;
};

export type DeleteListParams = {
    commandId: Uuid;
    listId: Uuid;
};

export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export type ListCollaborator = {
    id: Uuid;
    role: CollaboratorRole;
    canInvite: boolean;
    name: string;
    email?: string;
    initials: string;
    color: string;
};

export type PendingListInvite = {
    id: Uuid;
    email: string | null;
    role: Exclude<CollaboratorRole, 'OWNER'>;
    canInvite: boolean;
    expiresAt: string;
    usedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
};

export type ShoppingListSummary = {
    id: Uuid;
    title: string;
    status: ListStatusValue;
    itemCount: number;
    checkedCount: number;
    collaborators: ListCollaborator[];
    updatedAt: string;
};

export interface ListRepository {
    getList(listId: Uuid): Promise<ShoppingList | null>;

    getLists(): Promise<ShoppingListSummary[]>;

    getByIdForWrite(listId: Uuid): Promise<ShoppingList | null>;

    createList(params: CreateListParams): Promise<ShoppingList>;

    renameList(params: RenameListParams): Promise<void>;

    deleteList(params: DeleteListParams): Promise<void>;

    addItem(params: AddItemParams): Promise<void>;

    removeItem(params: RemoveItemParams): Promise<void>;

    toggleItem(params: ToggleItemParams): Promise<void>;

    changeStatus(params: ChangeStatusParams): Promise<void>;

    getCollaborators(listId: Uuid): Promise<ListCollaborator[]>;

    addCollaboratorByEmail(
        listId: Uuid,
        email: string,
        role: Exclude<CollaboratorRole, 'OWNER'>,
        canInvite?: boolean,
    ): Promise<string>;

    removeCollaborator(listId: Uuid, userId: Uuid): Promise<void>;

    generateInviteToken(
        listId: Uuid,
        role?: Exclude<CollaboratorRole, 'OWNER'>,
        canInvite?: boolean,
    ): Promise<string>;

    acceptInvite(token: string): Promise<Uuid>;

    getPendingInvites(listId: Uuid): Promise<PendingListInvite[]>;

    revokeInvite(inviteId: Uuid): Promise<void>;

    updateCollaboratorCanInvite(listId: Uuid, userId: Uuid, canInvite: boolean): Promise<void>;
}
