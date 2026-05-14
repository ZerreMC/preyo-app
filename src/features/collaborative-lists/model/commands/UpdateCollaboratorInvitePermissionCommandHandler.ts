import type {Result, Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type UpdateCollaboratorInvitePermissionCommand = {
    listId: Uuid;
    userId: Uuid;
    canInvite: boolean;
};
export type UpdateCollaboratorInvitePermissionCommandError = CommandError;

export class UpdateCollaboratorInvitePermissionCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(
        command: UpdateCollaboratorInvitePermissionCommand,
    ): Promise<Result<void, UpdateCollaboratorInvitePermissionCommandError>> {
        try {
            await this.repository.updateCollaboratorCanInvite(command.listId, command.userId, command.canInvite);
            return {ok: true, value: undefined};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
