import {DomainUuid, type Result, type Snapshot, type Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type RemoveItemCommand = { listId: Uuid; itemId: Uuid; commandId?: Uuid };
export type RemoveItemCommandError = CommandError;

export class RemoveItemCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: RemoveItemCommand): Promise<Result<Snapshot, RemoveItemCommandError>> {
        const list = await this.repository.getByIdForWrite(command.listId);
        if (!list) return {ok: false, error: {kind: 'LIST_NOT_FOUND', listId: command.listId}};

        const result = list.removeItem(command.itemId);
        if (!result.ok) return result;

        try {
            await this.repository.removeItem({
                commandId: command.commandId ?? DomainUuid.new(),
                listId: command.listId,
                itemId: command.itemId,
            });
            return {ok: true, value: list.snapshot()};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
