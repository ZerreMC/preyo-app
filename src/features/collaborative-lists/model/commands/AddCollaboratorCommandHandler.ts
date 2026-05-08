import type {Result, Uuid} from '../../domain/ShoppingList';
import {type CollaboratorRole, type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type AddCollaboratorCommand = {
    listId: Uuid;
    email: string;
    role: Exclude<CollaboratorRole, 'OWNER'>;
};
export type AddCollaboratorCommandError = CommandError;

export class AddCollaboratorCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: AddCollaboratorCommand): Promise<Result<void, AddCollaboratorCommandError>> {
        const email = command.email.trim().toLowerCase();
        if (!email.includes('@')) return {
            ok: false,
            error: {kind: 'INVALID_INPUT', message: 'Introduce un email válido.'}
        };

        try {
            await this.repository.addCollaboratorByEmail(command.listId, email, command.role);
            return {ok: true, value: undefined};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, command.listId)};
        }
    }
}
