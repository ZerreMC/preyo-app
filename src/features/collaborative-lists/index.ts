// Shared types for UI
export type {Uuid, ListStatusValue, ListItem, Snapshot, DomainError} from './domain/ShoppingList';

// Ports and Commands (CQRS Write)
export type {ListRepository} from './model/ports/ListRepository';
export {AddItemCommandHandler} from './model/commands/AddItemCommandHandler';
export type {AddItemCommand, AddItemCommandError} from './model/commands/AddItemCommandHandler';

// Queries and Read Models (CQRS Read)
export {getCollaborativeList} from './model/queries/getCollaborativeList';
export type {CollaborativeListReadModel, CollaborativeListItemReadModel} from './model/queries/getCollaborativeList';

// FSD UI Hooks
export {useCollaborativeList} from './model/hooks/useCollaborativeList';