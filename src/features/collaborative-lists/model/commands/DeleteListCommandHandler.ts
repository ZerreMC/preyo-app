import {DomainUuid, type Result, type Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type DeleteListCommand = { listId: Uuid; commandId?: Uuid };
export type DeleteListCommandError = CommandError;

export class DeleteListCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: DeleteListCommand): Promise<Result<void, DeleteListCommandError>> {
        try {
            await this.repository.deleteList({
                commandId: command.commandId ?? DomainUuid.new(),
                listId: command.listId,
            });
            return {ok: true, value: undefined};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
