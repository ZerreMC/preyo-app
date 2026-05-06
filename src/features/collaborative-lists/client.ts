"use client";

import {useCollaborativeList} from "./model/hooks/useCollaborativeList";
import {
    listCategories,
    mockLists,
    mockProducts,
    toListSummary,
    type ListCategory,
    type MockList,
    type MockListItem,
    type MockListSummary,
    type MockPendingInvite,
    type MockProduct,
} from "./model/mockLists";

export {useCollaborativeList};
export {listCategories, mockProducts};
export type {ListCategory, MockList, MockListItem, MockListSummary, MockPendingInvite, MockProduct};

const STORAGE_KEY = "preyo.mock.collaborative-lists.v1";
const CHANNEL_NAME = "preyo.mock.collaborative-lists";

export type CreateMockListInput = {
    title: string;
    categoryId: string;
    isTemplate?: boolean;
};

export type AddProductToListInput = {
    productId: string;
    quantity: number;
};

export type InviteRole = "editor" | "readonly";

type Listener = () => void;

const memoryListeners = new Set<Listener>();
let cachedLists: MockList[] = cloneLists(mockLists);
let cachedSummaries: MockListSummary[] | null = null;
let storageHydrated = false;

function cloneLists(lists: MockList[]): MockList[] {
    return lists.map((list) => ({
        ...list,
        items: list.items.map((item) => ({...item})),
        collaborators: list.collaborators.map((member) => ({...member})),
        pendingInvites: list.pendingInvites.map((invite) => ({...invite})),
    }));
}

function canUseStorage() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hydrateListsFromStorage() {
    if (!canUseStorage() || storageHydrated) return;
    storageHydrated = true;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedLists));
        return;
    }

    try {
        cachedLists = JSON.parse(raw) as MockList[];
        cachedSummaries = null;
    } catch {
        cachedLists = cloneLists(mockLists);
        cachedSummaries = null;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedLists));
    }
}

function readLists(): MockList[] {
    return cachedLists;
}

function writeLists(lists: MockList[]) {
    cachedLists = lists;
    cachedSummaries = null;
    if (!canUseStorage()) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    memoryListeners.forEach((listener) => listener());

    if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({type: "lists-updated"});
        channel.close();
    }
}

function mutateLists(mutator: (lists: MockList[]) => MockList[]) {
    hydrateListsFromStorage();
    const next = mutator(readLists());
    writeLists(next);
    return next;
}

function createId(prefix: string) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    }

    return `${prefix}-${Date.now().toString(36)}`;
}

function getInitials(email: string) {
    return email
        .split("@")[0]
        .split(/[._-]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "US";
}

function getCategoryById(categoryId: string) {
    return listCategories.find((category) => category.id === categoryId) ?? listCategories[0];
}

export function subscribeToMockLists(listener: Listener) {
    memoryListeners.add(listener);
    hydrateListsFromStorage();
    listener();

    const notifyFromExternalChange = () => {
        storageHydrated = false;
        hydrateListsFromStorage();
        cachedSummaries = null;
        listener();
    };

    const handleStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) notifyFromExternalChange();
    };

    let channel: BroadcastChannel | undefined;
    if (typeof window !== "undefined") {
        window.addEventListener("storage", handleStorage);

        if ("BroadcastChannel" in window) {
            channel = new BroadcastChannel(CHANNEL_NAME);
            channel.onmessage = notifyFromExternalChange;
        }
    }

    return () => {
        memoryListeners.delete(listener);
        if (typeof window !== "undefined") {
            window.removeEventListener("storage", handleStorage);
        }
        channel?.close();
    };
}

export function getLists(): MockListSummary[] {
    if (!cachedSummaries) {
        cachedSummaries = readLists().map(toListSummary);
    }

    return cachedSummaries;
}

export function getListById(listId: string): MockList | null {
    return readLists().find((list) => list.id === listId) ?? null;
}

export function toggleItemPurchased(listId: string, itemId: string) {
    mutateLists((lists) =>
        lists.map((list) =>
            list.id === listId
                ? {
                    ...list,
                    items: list.items.map((item) =>
                        item.id === itemId ? {...item, purchased: !item.purchased} : item,
                    ),
                    lastUpdate: "ahora",
                }
                : list,
        ),
    );
}

export function updateItemQuantity(listId: string, itemId: string, quantity: number) {
    mutateLists((lists) =>
        lists.map((list) =>
            list.id === listId
                ? {
                    ...list,
                    items: list.items.map((item) =>
                        item.id === itemId ? {...item, quantity: Math.max(1, quantity)} : item,
                    ),
                    lastUpdate: "ahora",
                }
                : list,
        ),
    );
}

export function deleteItem(listId: string, itemId: string) {
    mutateLists((lists) =>
        lists.map((list) =>
            list.id === listId
                ? {...list, items: list.items.filter((item) => item.id !== itemId), lastUpdate: "ahora"}
                : list,
        ),
    );
}

export function addProductsToList(listId: string, products: AddProductToListInput[]) {
    mutateLists((lists) =>
        lists.map((list) => {
            if (list.id !== listId) return list;

            const items = [...list.items];
            products.forEach(({productId, quantity}) => {
                const product = mockProducts.find((candidate) => candidate.id === productId);
                if (!product || quantity <= 0) return;

                const existingIndex = items.findIndex((item) => item.productId === productId);
                if (existingIndex >= 0) {
                    items[existingIndex] = {
                        ...items[existingIndex],
                        quantity: items[existingIndex].quantity + quantity,
                    };
                    return;
                }

                items.push({
                    id: createId("item"),
                    productId: product.id,
                    name: product.name,
                    category: product.category,
                    categoryEmoji: product.categoryEmoji,
                    quantity,
                    unit: product.unit,
                    estimatedPrice: product.estimatedPrice,
                    image: product.image,
                    purchased: false,
                });
            });

            return {...list, items, lastUpdate: "ahora"};
        }),
    );
}

export function createList(input: CreateMockListInput) {
    const category = getCategoryById(input.categoryId);
    const newList: MockList = {
        id: createId("lista"),
        title: input.title.trim(),
        categoryId: category.id,
        categoryEmoji: category.emoji,
        status: input.isTemplate ? "plantilla" : "borrador",
        lastUpdate: "ahora",
        isTemplate: input.isTemplate,
        collaborators: [
            {
                id: "ana",
                name: "Ana García",
                email: "ana@preyo.test",
                initials: "AG",
                color: "#39B86B",
                role: "owner",
            },
        ],
        pendingInvites: [],
        items: [],
    };

    mutateLists((lists) => [newList, ...lists]);
    return newList;
}

export function inviteMember(listId: string, email: string, role: InviteRole) {
    const invite: MockPendingInvite = {
        id: createId("invite"),
        email,
        role,
        createdAt: "ahora",
    };

    mutateLists((lists) =>
        lists.map((list) =>
            list.id === listId
                ? {
                    ...list,
                    pendingInvites: [
                        invite,
                        ...list.pendingInvites.filter((candidate) => candidate.email !== email),
                    ],
                    lastUpdate: "ahora",
                }
                : list,
        ),
    );

    return invite;
}

export function revokeMember(listId: string, memberId: string) {
    mutateLists((lists) =>
        lists.map((list) =>
            list.id === listId
                ? {
                    ...list,
                    collaborators: list.collaborators.filter((member) => member.id !== memberId || member.role === "owner"),
                    pendingInvites: list.pendingInvites.filter((invite) => invite.id !== memberId),
                    lastUpdate: "ahora",
                }
                : list,
        ),
    );
}

export function setListLocked(listId: string, locked: boolean) {
    mutateLists((lists) =>
        lists.map((list) =>
            list.id === listId ? {...list, isLocked: locked, lastUpdate: "ahora"} : list,
        ),
    );
}

export function acceptInviteAsMember(listId: string, email: string, role: InviteRole) {
    mutateLists((lists) =>
        lists.map((list) =>
            list.id === listId
                ? {
                    ...list,
                    pendingInvites: list.pendingInvites.filter((invite) => invite.email !== email),
                    collaborators: [
                        ...list.collaborators,
                        {
                            id: createId("member"),
                            name: email.split("@")[0] ?? email,
                            email,
                            initials: getInitials(email),
                            color: "#3347C4",
                            role,
                        },
                    ],
                    lastUpdate: "ahora",
                }
                : list,
        ),
    );
}
