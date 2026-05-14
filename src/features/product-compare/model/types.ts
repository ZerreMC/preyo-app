export type ProductCategory = "all" | "dairy" | "oils" | "cereals" | "drinks";

export type StorePriceStatus = "available" | "unavailable" | "stale";

export type StorePrice = {
    storeId: string;
    storeName: string;
    price: number | null;
    unitPrice: string;
    status: StorePriceStatus;
    updatedAtLabel: string;
};

export type PriceHistoryPoint = {
    month: string;
    price: number;
};

export type ComparableProduct = {
    id: string;
    name: string;
    unit: string;
    category: Exclude<ProductCategory, "all">;
    categoryLabel: string;
    icon: "oil" | "milk" | "rice" | "yogurt" | "coffee";
    savingsPercent: number;
    prices: StorePrice[];
    history: PriceHistoryPoint[];
};

export type ProductComparisonState = {
    products: ComparableProduct[];
    filteredProducts: ComparableProduct[];
    selectedProduct: ComparableProduct | null;
    selectedProductId: string | null;
    selectedCategory: ProductCategory;
    query: string;
    loading: boolean;
    error: string | null;
    realtimeLabel: string;
};

export type ToastTone = "success" | "error" | "info";

export type ComparatorToast = {
    tone: ToastTone;
    message: string;
};
