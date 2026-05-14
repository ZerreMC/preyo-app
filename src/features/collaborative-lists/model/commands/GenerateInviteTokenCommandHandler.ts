import type {Result, Uuid} from '../../domain/ShoppingList';
import {type CollaboratorRole, type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type GenerateInviteTokenCommand = {
    listId: Uuid;
    role?: Exclude<CollaboratorRole, 'OWNER'>;
    canInvite?: boolean;
};
export type GenerateInviteTokenCommandError = CommandError;

export class GenerateInviteTokenCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: GenerateInviteTokenCommand): Promise<Result<string, GenerateInviteTokenCommandError>> {
        try {
            const token = await this.repository.generateInviteToken(command.listId, command.role, command.canInvite);
            return {ok: true, value: token};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
