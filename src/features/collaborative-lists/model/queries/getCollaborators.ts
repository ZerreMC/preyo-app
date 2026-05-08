import type {Uuid} from '../../domain/ShoppingList';
import type {ListCollaborator, ListRepository} from '../ports/ListRepository';

export async function getCollaborators(repository: ListRepository, listId: Uuid): Promise<ListCollaborator[]> {
    return repository.getCollaborators(listId);
}
