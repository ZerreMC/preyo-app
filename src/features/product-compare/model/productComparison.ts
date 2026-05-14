import type {ComparableProduct, ProductCategory, StorePrice} from "./types";

export function getBestAvailablePrice(prices: StorePrice[]): StorePrice | null {
    let best: StorePrice | null = null;

    for (const price of prices) {
        if (price.status !== "available" || price.price === null) continue;
        if (!best || price.price < (best.price ?? Number.POSITIVE_INFINITY)) {
            best = price;
        }
    }

    return best;
}

export function getRankedStorePrices(prices: StorePrice[]): StorePrice[] {
    return [...prices].sort((a, b) => {
        const aPrice = a.status === "available" && a.price !== null ? a.price : Number.POSITIVE_INFINITY;
        const bPrice = b.status === "available" && b.price !== null ? b.price : Number.POSITIVE_INFINITY;

        if (aPrice !== bPrice) return aPrice - bPrice;
        return a.storeName.localeCompare(b.storeName);
    });
}

export function filterProducts(
    products: ComparableProduct[],
    category: ProductCategory,
    query: string,
): ComparableProduct[] {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-ES");

    return products.filter((product) => {
        const matchesCategory = category === "all" || product.category === category;
        if (!matchesCategory) return false;
        if (!normalizedQuery) return true;

        return [
            product.name,
            product.unit,
            product.categoryLabel,
        ].some((value) => value.toLocaleLowerCase("es-ES").includes(normalizedQuery));
    });
}

export function getPriceDeltaLabel(price: StorePrice, bestPrice: StorePrice | null): string {
    if (price.status !== "available" || price.price === null) return "Sin stock";
    if (!bestPrice?.price || price.storeId === bestPrice.storeId) return "Mejor precio";

    return `+${new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
    }).format(price.price - bestPrice.price)}`;
}
