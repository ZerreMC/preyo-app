import type {Result, Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type RevokeInviteCommand = { inviteId: Uuid };
export type RevokeInviteCommandError = CommandError;

export class RevokeInviteCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: RevokeInviteCommand): Promise<Result<void, RevokeInviteCommandError>> {
        try {
            await this.repository.revokeInvite(command.inviteId);
            return {ok: true, value: undefined};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error)};
        }
    }
}
