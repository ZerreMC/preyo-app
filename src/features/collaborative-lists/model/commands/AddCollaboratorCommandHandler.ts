import type {Result, Uuid} from '../../domain/ShoppingList';
import {type CollaboratorRole, type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type AddCollaboratorCommand = {
    listId: Uuid;
    email: string;
    role: Exclude<CollaboratorRole, 'OWNER'>;
    canInvite?: boolean;
};
export type AddCollaboratorCommandError = CommandError;

export class AddCollaboratorCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: AddCollaboratorCommand): Promise<Result<string, AddCollaboratorCommandError>> {
        const email = command.email.trim().toLowerCase();
        if (!email.includes('@')) return {
            ok: false,
            error: {kind: 'INVALID_EMAIL'}
        };

        try {
            const token = await this.repository.addCollaboratorByEmail(
                command.listId,
                email,
                command.role,
                command.canInvite,
            );
            return {ok: true, value: token};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
