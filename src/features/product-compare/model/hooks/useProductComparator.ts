"use client";

import {useMemo, useState} from "react";
import {demoProducts} from "../demoData";
import {filterProducts} from "../productComparison";
import type {ComparatorToast, ProductCategory} from "../types";

type PriceDraft = {
    productId: string;
    storeName: string;
    price: string;
    unit: string;
    date: string;
};

type ListDraft = {
    listId: string;
    quantity: string;
};

const initialProductId = demoProducts[0]?.id ?? null;

export function useProductComparator() {
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("all");
    const [selectedProductId, setSelectedProductId] = useState<string | null>(initialProductId);
    const [toast, setToast] = useState<ComparatorToast | null>(null);
    const [isAddPriceOpen, setIsAddPriceOpen] = useState(false);
    const [isAddToListOpen, setIsAddToListOpen] = useState(false);

    const filteredProducts = useMemo(
        () => filterProducts(demoProducts, selectedCategory, query),
        [query, selectedCategory],
    );

    const selectedProduct = useMemo(() => {
        return demoProducts.find((product) => product.id === selectedProductId) ?? filteredProducts[0] ?? null;
    }, [filteredProducts, selectedProductId]);

    function notify(nextToast: ComparatorToast) {
        setToast(nextToast);
        window.setTimeout(() => setToast(null), 2800);
    }

    function savePrice(draft: PriceDraft) {
        const normalizedPrice = Number(draft.price.replace(",", "."));
        if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
            notify({tone: "error", message: "El precio no es válido"});
            return false;
        }

        if (!draft.storeName.trim()) {
            notify({tone: "error", message: "Selecciona un supermercado"});
            return false;
        }

        setIsAddPriceOpen(false);
        notify({tone: "success", message: "Precio guardado"});
        return true;
    }

    function addToList(draft: ListDraft) {
        if (!draft.listId) {
            notify({tone: "error", message: "Selecciona una lista"});
            return false;
        }

        if (draft.quantity.trim().toLocaleLowerCase("es-ES") === "duplicado") {
            notify({tone: "error", message: "Este producto ya está en la lista"});
            return false;
        }

        setIsAddToListOpen(false);
        notify({tone: "success", message: "Producto añadido a la lista"});
        return true;
    }

    return {
        products: demoProducts,
        filteredProducts,
        selectedProduct,
        selectedProductId,
        selectedCategory,
        query,
        loading: false,
        error: null as string | null,
        realtimeLabel: "Actualizado hace unos segundos",
        toast,
        isAddPriceOpen,
        isAddToListOpen,
        setQuery,
        setSelectedCategory,
        setSelectedProductId,
        setIsAddPriceOpen,
        setIsAddToListOpen,
        savePrice,
        addToList,
    };
}
