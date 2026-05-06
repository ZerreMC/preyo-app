export type {Uuid, ListStatusValue, ListItem, Snapshot, DomainError} from "./domain/ShoppingList";

export type {ListRepository} from "./model/ports/ListRepository";
export {AddItemCommandHandler} from "./model/commands/AddItemCommandHandler";
export type {AddItemCommand, AddItemCommandError} from "./model/commands/AddItemCommandHandler";

export {getCollaborativeList} from "./model/queries/getCollaborativeList";
export type {CollaborativeListReadModel, CollaborativeListItemReadModel} from "./model/queries/getCollaborativeList";

/* useCollaborativeList is client-only → import from "@/features/collaborative-lists/client" */

export {
    AddProductsPageClient,
    CreateListModal,
    ListDetailPageClient,
    ListsPageClient,
    NewListPageClient,
    ShareListPageClient,
    PlanRoutePageClient
} from "./ui";
export type {CreateListInput} from "./ui";

export {mockLists, toListSummary} from "./model/mockLists";
export type {MockList, MockListSummary} from "./model/mockLists";
