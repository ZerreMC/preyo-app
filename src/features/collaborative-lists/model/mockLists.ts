import type {ListCardData} from "@/entities/shopping-list";

export type ListStatus =
    | "en-compra"
    | "borrador"
    | "plantilla"
    | "compartida"
    | "ruta-completada"
    | "compra-completada";

export type ListCategory = {
    id: string;
    emoji: string;
    label: string;
};

export type MockListMember = {
    id: string;
    name: string;
    email?: string;
    initials: string;
    color: string;
    role: "owner" | "editor" | "readonly";
};

export type MockPendingInvite = {
    id: string;
    email: string;
    role: "editor" | "readonly";
    createdAt: string;
};

export type MockListItem = {
    id: string;
    productId?: string;
    name: string;
    category: string;
    categoryEmoji: string;
    quantity: number;
    unit: string;
    estimatedPrice?: number;
    image?: string;
    purchased: boolean;
};

export type MockProduct = {
    id: string;
    name: string;
    category: string;
    categoryEmoji: string;
    unit: string;
    estimatedPrice: number;
    image?: string;
    source: string;
};

export type MockList = {
    id: string;
    title: string;
    categoryId: string;
    categoryEmoji: string;
    status: ListStatus;
    lastUpdate: string;
    items: MockListItem[];
    collaborators: MockListMember[];
    pendingInvites: MockPendingInvite[];
    isLocked?: boolean;
    isTemplate?: boolean;
};

export type MockListSummary = ListCardData & {
    status: ListStatus;
    lastUpdate: string;
};

export const listCategories: ListCategory[] = [
    {id: "semanal", emoji: "🛒", label: "Semanal"},
    {id: "cena", emoji: "🍽️", label: "Cena"},
    {id: "especial", emoji: "🎉", label: "Especial"},
    {id: "salud", emoji: "🥗", label: "Salud"},
    {id: "bebe", emoji: "🍼", label: "Bebé"},
    {id: "casa", emoji: "🏠", label: "Casa"},
    {id: "evento", emoji: "🥂", label: "Evento"},
];

export const mockProducts: MockProduct[] = [
    {id: "tomate-rama", name: "Tomate rama", category: "Frescos", categoryEmoji: "🥬", unit: "1 kg", estimatedPrice: 2.49, source: "Mercadona"},
    {id: "platano-canarias", name: "Plátano de Canarias", category: "Frescos", categoryEmoji: "🥬", unit: "1 kg", estimatedPrice: 1.89, source: "Lidl"},
    {id: "lechuga-romana", name: "Lechuga romana", category: "Frescos", categoryEmoji: "🥬", unit: "1 ud", estimatedPrice: 1.25, source: "Carrefour"},
    {id: "leche-entera", name: "Leche entera", category: "Lácteos", categoryEmoji: "🥛", unit: "1 L", estimatedPrice: 0.92, source: "Mercadona"},
    {id: "yogur-natural", name: "Yogur natural pack", category: "Lácteos", categoryEmoji: "🥛", unit: "6 uds", estimatedPrice: 1.85, source: "Dia"},
    {id: "queso-semicurado", name: "Queso semicurado", category: "Lácteos", categoryEmoji: "🥛", unit: "250 g", estimatedPrice: 3.15, source: "Carrefour"},
    {id: "arroz-redondo", name: "Arroz redondo", category: "Despensa", categoryEmoji: "🥫", unit: "1 kg", estimatedPrice: 1.35, source: "Mercadona"},
    {id: "pasta-macarron", name: "Macarrones", category: "Despensa", categoryEmoji: "🥫", unit: "500 g", estimatedPrice: 0.95, source: "Lidl"},
    {id: "aceite-oliva", name: "Aceite de oliva virgen extra", category: "Despensa", categoryEmoji: "🥫", unit: "1 L", estimatedPrice: 7.49, source: "Carrefour"},
    {id: "pollo-filetes", name: "Filetes de pollo", category: "Carnicería", categoryEmoji: "🍗", unit: "600 g", estimatedPrice: 4.95, source: "Mercadona"},
    {id: "salmon", name: "Salmón fresco", category: "Pescadería", categoryEmoji: "🐟", unit: "400 g", estimatedPrice: 6.8, source: "Carrefour"},
    {id: "detergente", name: "Detergente ropa", category: "Limpieza", categoryEmoji: "🧼", unit: "40 lavados", estimatedPrice: 5.75, source: "Dia"},
];

export const mockLists: MockList[] = [
    {
        id: "compra-semanal",
        title: "Compra semanal",
        categoryId: "semanal",
        categoryEmoji: "🛒",
        lastUpdate: "hace 5 min",
        status: "en-compra",
        collaborators: [
            {id: "ana", name: "Ana García", email: "ana@preyo.test", initials: "AG", color: "#39B86B", role: "owner"},
            {id: "marc", name: "Marc Pérez", email: "marc@preyo.test", initials: "MP", color: "#FF8A3D", role: "editor"},
        ],
        pendingInvites: [{id: "invite-laura", email: "laura@preyo.test", role: "editor", createdAt: "hace 1 h"}],
        items: [
            {id: "item-tomate", productId: "tomate-rama", name: "Tomate rama", category: "Frescos", categoryEmoji: "🥬", quantity: 1, unit: "kg", estimatedPrice: 2.49, purchased: false},
            {id: "item-platano", productId: "platano-canarias", name: "Plátano de Canarias", category: "Frescos", categoryEmoji: "🥬", quantity: 1, unit: "kg", estimatedPrice: 1.89, purchased: true},
            {id: "item-leche", productId: "leche-entera", name: "Leche entera", category: "Lácteos", categoryEmoji: "🥛", quantity: 3, unit: "L", estimatedPrice: 0.92, purchased: false},
            {id: "item-yogur", productId: "yogur-natural", name: "Yogur natural pack", category: "Lácteos", categoryEmoji: "🥛", quantity: 2, unit: "packs", estimatedPrice: 1.85, purchased: false},
            {id: "item-arroz", productId: "arroz-redondo", name: "Arroz redondo", category: "Despensa", categoryEmoji: "🥫", quantity: 1, unit: "kg", estimatedPrice: 1.35, purchased: true},
            {id: "item-pollo", productId: "pollo-filetes", name: "Filetes de pollo", category: "Carnicería", categoryEmoji: "🍗", quantity: 1, unit: "bandeja", estimatedPrice: 4.95, purchased: false},
        ],
    },
    {
        id: "cena-familiar",
        title: "Cena familiar",
        categoryId: "cena",
        categoryEmoji: "🍽️",
        lastUpdate: "ayer",
        status: "borrador",
        collaborators: [
            {id: "ana", name: "Ana García", email: "ana@preyo.test", initials: "AG", color: "#39B86B", role: "owner"},
            {id: "julia", name: "Julia Martín", email: "julia@preyo.test", initials: "JM", color: "#8B5CF6", role: "readonly"},
        ],
        pendingInvites: [],
        items: [],
    },
    {
        id: "limpieza-mes",
        title: "Limpieza del mes",
        categoryId: "casa",
        categoryEmoji: "🧹",
        lastUpdate: "hace 3 días",
        status: "borrador",
        isLocked: true,
        collaborators: [{id: "ana", name: "Ana García", email: "ana@preyo.test", initials: "AG", color: "#39B86B", role: "owner"}],
        pendingInvites: [],
        items: [
            {id: "item-detergente", productId: "detergente", name: "Detergente ropa", category: "Limpieza", categoryEmoji: "🧼", quantity: 1, unit: "botella", estimatedPrice: 5.75, purchased: false},
        ],
    },
    {
        id: "barbacoa",
        title: "Barbacoa sábado",
        categoryId: "especial",
        categoryEmoji: "🎉",
        lastUpdate: "lunes",
        status: "compartida",
        collaborators: [
            {id: "ana", name: "Ana García", email: "ana@preyo.test", initials: "AG", color: "#39B86B", role: "owner"},
            {id: "marc", name: "Marc Pérez", email: "marc@preyo.test", initials: "MP", color: "#FF8A3D", role: "editor"},
            {id: "lucia", name: "Lucía Cano", email: "lucia@preyo.test", initials: "LC", color: "#3347C4", role: "editor"},
        ],
        pendingInvites: [],
        items: [
            {id: "item-tomate-bbq", productId: "tomate-rama", name: "Tomate rama", category: "Frescos", categoryEmoji: "🥬", quantity: 2, unit: "kg", estimatedPrice: 2.49, purchased: false},
            {id: "item-pollo-bbq", productId: "pollo-filetes", name: "Filetes de pollo", category: "Carnicería", categoryEmoji: "🍗", quantity: 3, unit: "bandejas", estimatedPrice: 4.95, purchased: false},
        ],
    },
    {
        id: "plantilla-basicos",
        title: "Básicos de casa",
        categoryId: "casa",
        categoryEmoji: "🏠",
        lastUpdate: "hace 1 semana",
        status: "plantilla",
        isTemplate: true,
        collaborators: [{id: "ana", name: "Ana García", email: "ana@preyo.test", initials: "AG", color: "#39B86B", role: "owner"}],
        pendingInvites: [],
        items: [
            {id: "item-arroz-basic", productId: "arroz-redondo", name: "Arroz redondo", category: "Despensa", categoryEmoji: "🥫", quantity: 1, unit: "kg", estimatedPrice: 1.35, purchased: true},
            {id: "item-aceite-basic", productId: "aceite-oliva", name: "Aceite de oliva virgen extra", category: "Despensa", categoryEmoji: "🥫", quantity: 1, unit: "L", estimatedPrice: 7.49, purchased: true},
        ],
    },
];

export function toListSummary(list: MockList): MockListSummary {
    const itemCount = list.items.length;
    const purchasedCount = list.items.filter((item) => item.purchased).length;
    const totalPrice = list.items.reduce(
        (total, item) => total + (item.estimatedPrice ?? 0) * item.quantity,
        0,
    );

    return {
        id: list.id,
        title: list.title,
        categoryEmoji: list.categoryEmoji,
        itemCount,
        totalPrice,
        progressPct: itemCount > 0 ? Math.round((purchasedCount / itemCount) * 100) : 0,
        collaborators: list.collaborators,
        isLocked: list.isLocked,
        status: list.status,
        lastUpdate: list.lastUpdate,
    };
}
