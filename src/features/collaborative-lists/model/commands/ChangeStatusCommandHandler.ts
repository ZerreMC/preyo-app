import {DomainUuid, type ListStatusValue, type Result, type Snapshot, type Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type ChangeStatusCommand = { listId: Uuid; nextStatus: ListStatusValue; commandId?: Uuid };
export type ChangeStatusCommandError = CommandError;

export class ChangeStatusCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: ChangeStatusCommand): Promise<Result<Snapshot, ChangeStatusCommandError>> {
        const list = await this.repository.getByIdForWrite(command.listId);
        if (!list) return {ok: false, error: {kind: 'LIST_NOT_FOUND', listId: command.listId}};

        const result = list.transitionTo(command.nextStatus);
        if (!result.ok) return result;

        try {
            await this.repository.changeStatus({
                commandId: command.commandId ?? DomainUuid.new(),
                listId: command.listId,
                nextStatus: command.nextStatus,
            });
            return {ok: true, value: list.snapshot()};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
