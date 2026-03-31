import {
    DomainUuid,
    type DomainError,
    type Result,
    type Snapshot,
    type Uuid,
} from '../../domain/ShoppingList';
import {
    type ListRepository,
    RepositoryError,
} from '../ports/ListRepository';

export type AddItemCommand = {
    listId: Uuid;
    productRef: string;
    name: string;
    quantity?: string | null;
    estimatedWeightG: number;
    commandId?: Uuid;
    itemId?: Uuid;
};

export type AddItemCommandError =
    | DomainError
    | { kind: 'LIST_NOT_FOUND'; listId: Uuid }
    | { kind: 'UNAUTHORIZED' }
    | { kind: 'FORBIDDEN' };

export class AddItemCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: AddItemCommand): Promise<Result<Snapshot, AddItemCommandError>> {
        const list = await this.repository.getByIdForWrite(command.listId);

        if (!list) {
            return {ok: false, error: {kind: 'LIST_NOT_FOUND', listId: command.listId}};
        }

        const itemId = command.itemId ?? DomainUuid.new();
        const commandId = command.commandId ?? DomainUuid.new();

        const domainResult = list.addItem({
            id: itemId,
            productRef: command.productRef,
            name: command.name,
            quantity: command.quantity ?? null,
            estimatedWeightG: command.estimatedWeightG,
        });

        if (!domainResult.ok) {
            return domainResult;
        }

        try {
            await this.repository.addItem({
                commandId,
                listId: command.listId,
                itemId,
                productRef: command.productRef,
                name: command.name,
                quantity: command.quantity ?? null,
                estimatedWeightG: command.estimatedWeightG,
            });
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;

            const snapshot = list.snapshot();

            switch (error.code) {
                case 'UNAUTHORIZED':
                    return {ok: false, error: {kind: 'UNAUTHORIZED'}};

                case 'FORBIDDEN':
                    return {ok: false, error: {kind: 'FORBIDDEN'}};

                case 'NOT_FOUND':
                    return {ok: false, error: {kind: 'LIST_NOT_FOUND', listId: command.listId}};

                case 'LIST_LOCKED':
                    return {ok: false, error: {kind: 'LIST_LOCKED', status: snapshot.status}};

                case 'DUPLICATE_PRODUCT':
                    return {ok: false, error: {kind: 'DUPLICATE_PRODUCT', productRef: command.productRef}};

                case 'CAPACITY_EXCEEDED': {
                    // snapshot already includes the optimistically-added item; exclude it
                    // by id to obtain the real weight before this command
                    const weightBeforeAdd = snapshot.items
                        .filter((item) => item.id !== itemId)
                        .reduce((acc, item) => acc + item.estimatedWeightG, 0);

                    return {
                        ok: false,
                        error: {
                            kind: 'CAPACITY_EXCEEDED',
                            current: weightBeforeAdd,
                            limit: snapshot.transportCapacityG,
                        },
                    };
                }

                default:
                    throw error;
            }
        }

        return {ok: true, value: list.snapshot()};
    }
}