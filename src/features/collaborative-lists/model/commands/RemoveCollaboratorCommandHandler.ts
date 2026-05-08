import type {Result, Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type RemoveCollaboratorCommand = { listId: Uuid; userId: Uuid };
export type RemoveCollaboratorCommandError = CommandError;

export class RemoveCollaboratorCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: RemoveCollaboratorCommand): Promise<Result<void, RemoveCollaboratorCommandError>> {
        try {
            await this.repository.removeCollaborator(command.listId, command.userId);
            return {ok: true, value: undefined};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
