import type {Result, Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type AcceptInviteCommand = { token: Uuid };
export type AcceptInviteCommandError = CommandError;

export class AcceptInviteCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: AcceptInviteCommand): Promise<Result<Uuid, AcceptInviteCommandError>> {
        try {
            const listId = await this.repository.acceptInvite(command.token);
            return {ok: true, value: listId};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error)};
        }
    }
}
