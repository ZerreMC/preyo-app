import {DomainUuid, type Result, type Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type RenameListCommand = { listId: Uuid; title: string; commandId?: Uuid };
export type RenameListCommandError = CommandError;

export class RenameListCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: RenameListCommand): Promise<Result<void, RenameListCommandError>> {
        const title = command.title.trim();
        if (!title) return {
            ok: false,
            error: {kind: 'INVALID_INPUT', message: 'El nombre de la lista es obligatorio.'}
        };

        try {
            await this.repository.renameList({
                commandId: command.commandId ?? DomainUuid.new(),
                listId: command.listId,
                title,
            });
            return {ok: true, value: undefined};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
