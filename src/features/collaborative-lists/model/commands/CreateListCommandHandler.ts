import {DomainUuid, type Result, type Snapshot, type Uuid} from '../../domain/ShoppingList';
import {type ListRepository, RepositoryError} from '../ports/ListRepository';
import {mapRepositoryError, type CommandError} from './shared';

export type CreateListCommand = {
    title: string;
    transportCapacityG?: number;
    commandId?: Uuid;
    listId?: Uuid;
};

export type CreateListCommandError = CommandError;

export class CreateListCommandHandler {
    constructor(private readonly repository: ListRepository) {
    }

    async execute(command: CreateListCommand): Promise<Result<Snapshot, CreateListCommandError>> {
        const title = command.title.trim();
        if (!title) return {
            ok: false,
            error: {kind: 'INVALID_INPUT', message: 'El nombre de la lista es obligatorio.'}
        };

        const transportCapacityG = command.transportCapacityG ?? 20000;
        if (!Number.isInteger(transportCapacityG) || transportCapacityG <= 0) {
            return {ok: false, error: {kind: 'INVALID_INPUT', message: 'La capacidad debe ser positiva.'}};
        }

        const listId = command.listId ?? DomainUuid.new();
        const commandId = command.commandId ?? DomainUuid.new();

        try {
            const list = await this.repository.createList({commandId, listId, title, transportCapacityG});
            return {ok: true, value: list.snapshot()};
        } catch (error) {
            if (!(error instanceof RepositoryError)) throw error;
            return {ok: false, error: mapRepositoryError(error, listId)};
        }
    }
}
