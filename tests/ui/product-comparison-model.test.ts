import {describe, expect, it} from "vitest";
import {demoProducts, filterProducts, getBestAvailablePrice, getPriceDeltaLabel, getRankedStorePrices} from "@/features/product-compare";
import type {StorePrice} from "@/features/product-compare";

describe("product comparison model", () => {
    it("sorts available prices first by price and unavailable prices last", () => {
        const prices: StorePrice[] = [
            {storeId: "stale", storeName: "Stale", price: 1.2, unitPrice: "1,20 €/u", status: "stale", updatedAtLabel: "Hace días"},
            {storeId: "b", storeName: "B", price: 1.1, unitPrice: "1,10 €/u", status: "available", updatedAtLabel: "Hoy"},
            {storeId: "a", storeName: "A", price: 0.9, unitPrice: "0,90 €/u", status: "available", updatedAtLabel: "Hoy"},
            {storeId: "none", storeName: "None", price: null, unitPrice: "—", status: "unavailable", updatedAtLabel: "Sin stock"},
        ];

        expect(getRankedStorePrices(prices).map((price) => price.storeId)).toEqual(["a", "b", "none", "stale"]);
    });

    it("finds the best available price", () => {
        const product = demoProducts[0];
        const best = getBestAvailablePrice(product.prices);

        expect(best?.storeName).toBe("Mercaval");
    });

    it("filters products by category and query", () => {
        const result = filterProducts(demoProducts, "dairy", "leche");

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Leche entera");
    });

    it("formats price delta labels", () => {
        const product = demoProducts[0];
        const best = getBestAvailablePrice(product.prices);
        const second = product.prices.find((price) => price.storeId === "aldi-sol");

        expect(second ? getPriceDeltaLabel(second, best).replace(/\s/u, " ") : "").toBe("+0,30 €");
    });
});
