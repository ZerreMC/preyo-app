// TODO: reemplazar con query Supabase cuando existan tablas products + price_entries

export type ProductStore = {
    storeName: string;
    price: number;        // en euros
    isBestPrice: boolean;
};

export type CatalogProduct = {
    id: string;
    name: string;
    brand: string;
    emoji: string;
    categories: string[];    // el primero es la categoría principal mostrada en UI
    categoryEmoji: string;
    unit: string;
    popularityScore: number; // 1-100
    pricesByStore: ProductStore[];
};

export function getBestStore(product: CatalogProduct): ProductStore {
    return product.pricesByStore.find((s) => s.isBestPrice) ?? product.pricesByStore[0];
}

export function getBestPrice(product: CatalogProduct): number {
    return getBestStore(product).price;
}

export function getEstimatedSavings(product: CatalogProduct): number {
    const prices = product.pricesByStore.map((s) => s.price);
    return Math.max(...prices) - Math.min(...prices);
}

export function getCatalogCategories(): string[] {
    const cats = new Set<string>();
    CATALOG_PRODUCTS.forEach((p) => cats.add(p.categories[0]));
    return Array.from(cats).sort();
}

export function getCatalogStores(): string[] {
    const stores = new Set<string>();
    CATALOG_PRODUCTS.forEach((p) => p.pricesByStore.forEach((s) => stores.add(s.storeName)));
    return Array.from(stores).sort();
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
    // ── Lácteos ───────────────────────────────────────────────────────────
    {
        id: "leche-entera",
        name: "Leche entera",
        brand: "Lauki Clásica",
        emoji: "🥛",
        categories: ["Lácteos"],
        categoryEmoji: "🥛",
        unit: "1 L",
        popularityScore: 95,
        pricesByStore: [
            {storeName: "Mercadona", price: 0.89, isBestPrice: false},
            {storeName: "Lidl", price: 0.79, isBestPrice: true},
            {storeName: "Carrefour", price: 0.95, isBestPrice: false},
            {storeName: "Dia", price: 0.85, isBestPrice: false},
        ],
    },
    {
        id: "yogur-natural",
        name: "Yogur natural pack",
        brand: "Danone",
        emoji: "🫙",
        categories: ["Lácteos"],
        categoryEmoji: "🥛",
        unit: "4 uds",
        popularityScore: 82,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.49, isBestPrice: false},
            {storeName: "Lidl", price: 1.29, isBestPrice: true},
            {storeName: "Carrefour", price: 1.65, isBestPrice: false},
        ],
    },
    {
        id: "queso-manchego",
        name: "Queso manchego semicurado",
        brand: "Don Simón",
        emoji: "🧀",
        categories: ["Lácteos"],
        categoryEmoji: "🥛",
        unit: "250 g",
        popularityScore: 74,
        pricesByStore: [
            {storeName: "Mercadona", price: 3.45, isBestPrice: false},
            {storeName: "Carrefour", price: 3.99, isBestPrice: false},
            {storeName: "Dia", price: 3.25, isBestPrice: true},
        ],
    },
    {
        id: "mantequilla",
        name: "Mantequilla con sal",
        brand: "La Lechera",
        emoji: "🧈",
        categories: ["Lácteos"],
        categoryEmoji: "🥛",
        unit: "250 g",
        popularityScore: 68,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.89, isBestPrice: false},
            {storeName: "Lidl", price: 1.65, isBestPrice: true},
            {storeName: "Carrefour", price: 2.10, isBestPrice: false},
        ],
    },
    // ── Frescos ───────────────────────────────────────────────────────────
    {
        id: "tomate-rama",
        name: "Tomate rama",
        brand: "Huerta Ruiz",
        emoji: "🍅",
        categories: ["Frescos"],
        categoryEmoji: "🥬",
        unit: "1 kg",
        popularityScore: 91,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.89, isBestPrice: false},
            {storeName: "Lidl", price: 1.49, isBestPrice: true},
            {storeName: "Carrefour", price: 1.99, isBestPrice: false},
        ],
    },
    {
        id: "platano-canarias",
        name: "Plátano de Canarias",
        brand: "Tropical Fresh",
        emoji: "🍌",
        categories: ["Frescos"],
        categoryEmoji: "🥬",
        unit: "1 kg",
        popularityScore: 88,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.59, isBestPrice: false},
            {storeName: "Lidl", price: 1.29, isBestPrice: true},
            {storeName: "Dia", price: 1.45, isBestPrice: false},
        ],
    },
    {
        id: "manzana-golden",
        name: "Manzana Golden",
        brand: "Frutas Ruiz",
        emoji: "🍎",
        categories: ["Frescos"],
        categoryEmoji: "🥬",
        unit: "1 kg",
        popularityScore: 79,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.49, isBestPrice: false},
            {storeName: "Carrefour", price: 1.35, isBestPrice: true},
            {storeName: "Dia", price: 1.55, isBestPrice: false},
        ],
    },
    {
        id: "lechuga-romana",
        name: "Lechuga romana",
        brand: "Huerta Ruiz",
        emoji: "🥬",
        categories: ["Frescos"],
        categoryEmoji: "🥬",
        unit: "1 ud",
        popularityScore: 72,
        pricesByStore: [
            {storeName: "Mercadona", price: 0.99, isBestPrice: false},
            {storeName: "Lidl", price: 0.79, isBestPrice: true},
            {storeName: "Carrefour", price: 1.10, isBestPrice: false},
        ],
    },
    // ── Despensa ──────────────────────────────────────────────────────────
    {
        id: "arroz-redondo",
        name: "Arroz redondo",
        brand: "La Fallera",
        emoji: "🌾",
        categories: ["Despensa"],
        categoryEmoji: "🥫",
        unit: "1 kg",
        popularityScore: 87,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.35, isBestPrice: false},
            {storeName: "Lidl", price: 0.99, isBestPrice: true},
            {storeName: "Carrefour", price: 1.45, isBestPrice: false},
            {storeName: "Dia", price: 1.15, isBestPrice: false},
        ],
    },
    {
        id: "pasta-macarron",
        name: "Macarrones",
        brand: "Gallo",
        emoji: "🍝",
        categories: ["Despensa"],
        categoryEmoji: "🥫",
        unit: "500 g",
        popularityScore: 83,
        pricesByStore: [
            {storeName: "Mercadona", price: 0.95, isBestPrice: false},
            {storeName: "Lidl", price: 0.79, isBestPrice: true},
            {storeName: "Carrefour", price: 1.05, isBestPrice: false},
        ],
    },
    {
        id: "aceite-oliva",
        name: "Aceite de oliva AOVE",
        brand: "Molino Sur 0,4°",
        emoji: "🫒",
        categories: ["Despensa"],
        categoryEmoji: "🥫",
        unit: "1 L",
        popularityScore: 76,
        pricesByStore: [
            {storeName: "Mercadona", price: 7.49, isBestPrice: false},
            {storeName: "Carrefour", price: 6.99, isBestPrice: true},
            {storeName: "Dia", price: 7.89, isBestPrice: false},
        ],
    },
    {
        id: "cafe-molido",
        name: "Café molido natural",
        brand: "Molturado Suave",
        emoji: "☕",
        categories: ["Despensa"],
        categoryEmoji: "🥫",
        unit: "250 g",
        popularityScore: 71,
        pricesByStore: [
            {storeName: "Mercadona", price: 2.79, isBestPrice: false},
            {storeName: "Lidl", price: 2.35, isBestPrice: true},
            {storeName: "Carrefour", price: 3.10, isBestPrice: false},
        ],
    },
    // ── Panadería ─────────────────────────────────────────────────────────
    {
        id: "pan-integral",
        name: "Pan integral de molde",
        brand: "Bimbo",
        emoji: "🍞",
        categories: ["Panadería"],
        categoryEmoji: "🥖",
        unit: "460 g",
        popularityScore: 78,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.29, isBestPrice: false},
            {storeName: "Lidl", price: 0.99, isBestPrice: true},
            {storeName: "Carrefour", price: 1.45, isBestPrice: false},
        ],
    },
    {
        id: "croissants",
        name: "Croissants pack 6",
        brand: "Dulce Mañana",
        emoji: "🥐",
        categories: ["Panadería"],
        categoryEmoji: "🥖",
        unit: "6 uds",
        popularityScore: 65,
        pricesByStore: [
            {storeName: "Mercadona", price: 2.45, isBestPrice: true},
            {storeName: "Carrefour", price: 2.89, isBestPrice: false},
        ],
    },
    // ── Bebidas ───────────────────────────────────────────────────────────
    {
        id: "agua-mineral",
        name: "Agua mineral",
        brand: "Font Vella",
        emoji: "💧",
        categories: ["Bebidas"],
        categoryEmoji: "🧃",
        unit: "6 × 1,5 L",
        popularityScore: 93,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.15, isBestPrice: false},
            {storeName: "Lidl", price: 0.99, isBestPrice: true},
            {storeName: "Carrefour", price: 1.25, isBestPrice: false},
            {storeName: "Dia", price: 1.05, isBestPrice: false},
        ],
    },
    {
        id: "zumo-naranja",
        name: "Zumo de naranja",
        brand: "Don Simón",
        emoji: "🧃",
        categories: ["Bebidas"],
        categoryEmoji: "🧃",
        unit: "1 L",
        popularityScore: 69,
        pricesByStore: [
            {storeName: "Mercadona", price: 1.65, isBestPrice: false},
            {storeName: "Carrefour", price: 1.89, isBestPrice: false},
            {storeName: "Dia", price: 1.55, isBestPrice: true},
        ],
    },
    // ── Limpieza ──────────────────────────────────────────────────────────
    {
        id: "detergente",
        name: "Detergente líquido",
        brand: "Skip Active",
        emoji: "🧼",
        categories: ["Limpieza"],
        categoryEmoji: "🧼",
        unit: "30 lavados",
        popularityScore: 75,
        pricesByStore: [
            {storeName: "Mercadona", price: 5.99, isBestPrice: false},
            {storeName: "Carrefour", price: 5.49, isBestPrice: true},
            {storeName: "Dia", price: 6.25, isBestPrice: false},
        ],
    },
    {
        id: "papel-higienico",
        name: "Papel higiénico",
        brand: "Scottex",
        emoji: "🧻",
        categories: ["Limpieza"],
        categoryEmoji: "🧼",
        unit: "12 rollos",
        popularityScore: 80,
        pricesByStore: [
            {storeName: "Mercadona", price: 4.45, isBestPrice: false},
            {storeName: "Lidl", price: 3.99, isBestPrice: true},
            {storeName: "Carrefour", price: 4.89, isBestPrice: false},
        ],
    },
    // ── Proteínas ─────────────────────────────────────────────────────────
    {
        id: "pollo-filetes",
        name: "Filetes de pollo",
        brand: "El Pollo Real",
        emoji: "🍗",
        categories: ["Carnicería"],
        categoryEmoji: "🍗",
        unit: "600 g",
        popularityScore: 85,
        pricesByStore: [
            {storeName: "Mercadona", price: 4.95, isBestPrice: false},
            {storeName: "Carrefour", price: 5.45, isBestPrice: false},
            {storeName: "Dia", price: 4.75, isBestPrice: true},
        ],
    },
    {
        id: "salmon",
        name: "Salmón fresco",
        brand: "Pescaderías Ruiz",
        emoji: "🐟",
        categories: ["Pescadería"],
        categoryEmoji: "🐟",
        unit: "400 g",
        popularityScore: 67,
        pricesByStore: [
            {storeName: "Mercadona", price: 9.99, isBestPrice: false},
            {storeName: "Carrefour", price: 11.50, isBestPrice: false},
            {storeName: "Lidl", price: 9.49, isBestPrice: true},
        ],
    },
];
