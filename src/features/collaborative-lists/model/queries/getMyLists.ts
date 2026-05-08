import type {ListRepository, ShoppingListSummary} from '../ports/ListRepository';

export async function getMyLists(repository: ListRepository): Promise<ShoppingListSummary[]> {
    return repository.getLists();
}
