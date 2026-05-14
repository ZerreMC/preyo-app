import {DomainUuid, type Result, type Snapshot, type Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type ToggleItemCommand = { listId: Uuid; itemId: Uuid; checked: boolean; commandId?: Uuid };
export type ToggleItemCommandError = CommandError;

export class ToggleItemCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: ToggleItemCommand): Promise<Result<Snapshot, ToggleItemCommandError>> {
        const list = await this.repository.getByIdForWrite(command.listId);
        if (!list) return {ok: false, error: {kind: 'LIST_NOT_FOUND', listId: command.listId}};

        const result = list.toggleItem(command.itemId, command.checked);
        if (!result.ok) return result;

        try {
            await this.repository.toggleItem({
                commandId: command.commandId ?? DomainUuid.new(),
                listId: command.listId,
                itemId: command.itemId,
                checked: command.checked,
            });
            return {ok: true, value: list.snapshot()};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
