export type {Uuid, ListStatusValue, ListItem, Snapshot, DomainError} from "./domain/ShoppingList";

export type {
    CollaboratorRole,
    ListCollaborator,
    ListRepository,
    ShoppingListSummary,
} from "./model/ports/ListRepository";
export {SupabaseListRepository} from "./api/SupabaseListRepository";

export {AddItemCommandHandler} from "./model/commands/AddItemCommandHandler";
export type {AddItemCommand, AddItemCommandError} from "./model/commands/AddItemCommandHandler";
export {AcceptInviteCommandHandler} from "./model/commands/AcceptInviteCommandHandler";
export {AddCollaboratorCommandHandler} from "./model/commands/AddCollaboratorCommandHandler";
export {ChangeStatusCommandHandler} from "./model/commands/ChangeStatusCommandHandler";
export {CreateListCommandHandler} from "./model/commands/CreateListCommandHandler";
export {DeleteListCommandHandler} from "./model/commands/DeleteListCommandHandler";
export {GenerateInviteTokenCommandHandler} from "./model/commands/GenerateInviteTokenCommandHandler";
export {RemoveCollaboratorCommandHandler} from "./model/commands/RemoveCollaboratorCommandHandler";
export {RemoveItemCommandHandler} from "./model/commands/RemoveItemCommandHandler";
export {RenameListCommandHandler} from "./model/commands/RenameListCommandHandler";
export {ToggleItemCommandHandler} from "./model/commands/ToggleItemCommandHandler";

export {getCollaborativeList} from "./model/queries/getCollaborativeList";
export type {CollaborativeListReadModel, CollaborativeListItemReadModel} from "./model/queries/getCollaborativeList";
export {getMyLists} from "./model/queries/getMyLists";
export {getCollaborators} from "./model/queries/getCollaborators";

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
