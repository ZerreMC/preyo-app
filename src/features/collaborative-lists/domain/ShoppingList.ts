export type Uuid = string & { readonly _brand: 'uuid' };

export const DomainUuid = {
    new: () => crypto.randomUUID() as Uuid
};

export type ListStatusValue = 'draft' | 'active' | 'shopping' | 'completed' | 'archived';

export type ListItem = Readonly<{
    id: Uuid;
    productRef: string;
    name: string;
    quantity: string | null;
    estimatedWeightG: number;
    checked: boolean;
}>;

export type Snapshot = Readonly<{
    id: Uuid;
    ownerId: Uuid;
    title: string;
    status: ListStatusValue;
    transportCapacityG: number;
    items: ListItem[];
}>;

export type DomainError =
    | { kind: 'LIST_LOCKED'; status: ListStatusValue }
    | { kind: 'DUPLICATE_PRODUCT'; productRef: string }
    | { kind: 'CAPACITY_EXCEEDED'; current: number; limit: number }
    | { kind: 'ITEM_NOT_FOUND'; id: Uuid }
    | { kind: 'INVALID_INPUT'; message: string };

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const StatusRules = {
    canEdit: (status: ListStatusValue) => status === 'draft' || status === 'active',
    canToggle: (status: ListStatusValue) => ['draft', 'active', 'shopping'].includes(status),
    isFinal: (status: ListStatusValue) => ['completed', 'archived'].includes(status),
    canTransition: (from: ListStatusValue, to: ListStatusValue): boolean => {
        const transitions: Record<ListStatusValue, ListStatusValue[]> = {
            draft: ['active', 'archived'],
            active: ['shopping', 'archived'],
            shopping: ['completed', 'archived'],
            completed: [],
            archived: [],
        };
        return transitions[from]?.includes(to) ?? false;
    }
};


export class ShoppingList {

    private constructor(
        public readonly id: Uuid,
        public readonly ownerId: Uuid,
        private state: {
            title: string;
            status: ListStatusValue;
            capacity: number;
            items: Map<Uuid, ListItem>;
            weight: number;
        }
    ) {
    }

    // hydrate a list from a snapshot: set its state to the snapshot's state'
    static hydrate(snapshot: Snapshot): ShoppingList {
        return new ShoppingList(snapshot.id, snapshot.ownerId, {
            title: snapshot.title,
            status: snapshot.status,
            capacity: snapshot.transportCapacityG,
            items: new Map(snapshot.items.map(i => [i.id, i])),
            weight: snapshot.items.reduce((acc, i) => acc + i.estimatedWeightG, 0)
        });
    }

    // snapshot the current state of the list
    snapshot(): Snapshot {
        return {
            id: this.id,
            ownerId: this.ownerId,
            title: this.state.title,
            status: this.state.status,
            transportCapacityG: this.state.capacity,
            items: Array.from(this.state.items.values())
        };
    }

    // add a new item to the list
    addItem(input: Omit<ListItem, 'checked'>): Result<void, DomainError> {
        const {status, items, weight, capacity} = this.state;

        if (!StatusRules.canEdit(status)) {
            return {ok: false, error: {kind: 'LIST_LOCKED', status}};
        }

        const productRef = input.productRef.trim();
        if (!productRef || !input.name.trim()) {
            return {ok: false, error: {kind: 'INVALID_INPUT', message: 'Invalid item data'}};
        }

        if (!Number.isInteger(input.estimatedWeightG) || input.estimatedWeightG < 0) {
            return {ok: false, error: {kind: 'INVALID_INPUT', message: 'Invalid weight'}};
        }

        const isDuplicate = Array.from(items.values())
            .some(i => i.productRef.toLowerCase() === productRef.toLowerCase());

        if (isDuplicate) {
            return {ok: false, error: {kind: 'DUPLICATE_PRODUCT', productRef}};
        }

        if (weight + input.estimatedWeightG > capacity) {
            return {
                ok: false,
                error: {kind: 'CAPACITY_EXCEEDED', current: weight + input.estimatedWeightG, limit: capacity}
            };
        }

        this.state.items.set(input.id, {...input, productRef, checked: false});
        this.state.weight += input.estimatedWeightG;

        return {ok: true, value: undefined};
    }

    // remove an item by id
    removeItem(itemId: Uuid): Result<void, DomainError> {
        if (!StatusRules.canEdit(this.state.status)) {
            return {ok: false, error: {kind: 'LIST_LOCKED', status: this.state.status}};
        }

        const item = this.state.items.get(itemId);
        if (!item) return {ok: false, error: {kind: 'ITEM_NOT_FOUND', id: itemId}};

        this.state.weight -= item.estimatedWeightG;
        this.state.items.delete(itemId);

        return {ok: true, value: undefined};
    }

    toggleItem(itemId: Uuid, checked: boolean): Result<void, DomainError> {
        if (!StatusRules.canToggle(this.state.status)) {
            return {ok: false, error: {kind: 'LIST_LOCKED', status: this.state.status}};
        }

        const item = this.state.items.get(itemId);
        if (!item) return {ok: false, error: {kind: 'ITEM_NOT_FOUND', id: itemId}};

        this.state.items.set(itemId, {...item, checked});
        return {ok: true, value: undefined};
    }

    transitionTo(next: ListStatusValue): Result<void, DomainError> {
        const current = this.state.status;
        if (current === next) return {ok: true, value: undefined};

        if (StatusRules.isFinal(current) || !StatusRules.canTransition(current, next)) {
            return {ok: false, error: {kind: 'INVALID_INPUT', message: `Cannot transition from ${current} to ${next}`}};
        }

        this.state.status = next;
        return {ok: true, value: undefined};
    }
}