"use client";

import {useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {ArrowLeft, Check, ChevronDown, ChevronUp, Search, ShoppingCart, SortAsc, Store, X} from "lucide-react";
import {cn, formatCurrency} from "@/shared/lib";
import {routes} from "@/shared/config/routes";
import {QuantityStepper} from "@/shared/ui";
import {addProductsToList, getListById} from "../client";
import {
    CATALOG_PRODUCTS,
    CatalogProduct,
    ProductStore,
    getBestPrice,
    getBestStore,
    getCatalogCategories,
    getCatalogStores,
    getEstimatedSavings,
} from "../model/catalogProducts";

type SortOption = "popular" | "price-asc" | "savings" | "alpha";

type Props = {
    listId: string;
};

export function AddProductsPageClient({listId}: Props) {
    const router = useRouter();
    const prefersReduced = useReducedMotion();

    const [query, setQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("all");
    const [activeStoreId, setActiveStoreId] = useState("all");
    const [sortBy, setSortBy] = useState<SortOption>("popular");
    const [showOnlyAdded, setShowOnlyAdded] = useState(false);
    const [selected, setSelected] = useState<Record<string, number>>({});
    const [selectedStoreByProduct, setSelectedStoreByProduct] = useState<Record<string, string>>({});
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const listTitle = useMemo(() => getListById(listId)?.title ?? "Mi lista", [listId]);
    const categories = useMemo(() => getCatalogCategories(), []);
    const stores = useMemo(() => getCatalogStores(), []);

    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        let result = CATALOG_PRODUCTS;

        if (q) {
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.brand.toLowerCase().includes(q) ||
                    p.categories.some((c) => c.toLowerCase().includes(q)),
            );
        }
        if (activeCategoryId !== "all") {
            result = result.filter((p) => p.categories[0] === activeCategoryId);
        }
        if (activeStoreId !== "all") {
            result = result.filter((p) => p.pricesByStore.some((s) => s.storeName === activeStoreId));
        }
        if (showOnlyAdded) {
            result = result.filter((p) => selected[p.id] !== undefined);
        }

        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case "popular":
                    return b.popularityScore - a.popularityScore;
                case "price-asc":
                    return getBestPrice(a) - getBestPrice(b);
                case "savings":
                    return getEstimatedSavings(b) - getEstimatedSavings(a);
                case "alpha":
                    return a.name.localeCompare(b.name, "es");
            }
        });

        return result;
    }, [query, activeCategoryId, activeStoreId, sortBy, showOnlyAdded, selected]);

    const getEffectiveStore = (product: CatalogProduct): ProductStore => {
        const preferredName = selectedStoreByProduct[product.id];
        if (preferredName) {
            return (
                product.pricesByStore.find((s) => s.storeName === preferredName) ??
                getBestStore(product)
            );
        }
        return getBestStore(product);
    };

    const selectedCount = Object.keys(selected).length;
    const totalItems = Object.values(selected).reduce((s, q) => s + q, 0);
    const totalPrice = Object.entries(selected).reduce((sum, [id, qty]) => {
        const product = CATALOG_PRODUCTS.find((p) => p.id === id);
        if (!product) return sum;
        return sum + getEffectiveStore(product).price * qty;
    }, 0);

    const handleAddProduct = (productId: string) => {
        setSelected((cur) => ({...cur, [productId]: 1}));
    };

    const handleRemoveProduct = (productId: string) => {
        setSelected((cur) => {
            const next = {...cur};
            delete next[productId];
            return next;
        });
        setSelectedStoreByProduct((cur) => {
            const next = {...cur};
            delete next[productId];
            return next;
        });
    };

    const handleQuantityChange = (productId: string, value: number) => {
        setSelected((cur) => ({...cur, [productId]: value}));
    };

    const handleStoreSelect = (productId: string, storeName: string) => {
        setSelectedStoreByProduct((cur) => ({...cur, [productId]: storeName}));
        setExpandedProductId(null);
    };

    const handleConfirm = () => {
        if (isSaving || selectedCount === 0) return;
        setIsSaving(true);
        const products = Object.entries(selected).map(([productId, quantity]) => ({
            productId,
            quantity,
        }));
        // TODO: usar AddItemCommandHandler con Supabase real
        addProductsToList(listId, products);
        router.push(routes.listDetail(listId));
    };

    const panelTransition = prefersReduced
        ? {duration: 0}
        : {type: "spring" as const, stiffness: 300, damping: 30};

    const ctaTransition = prefersReduced
        ? {duration: 0}
        : {type: "spring" as const, stiffness: 400, damping: 35};

    return (
        <div className="flex min-h-full flex-col bg-bg-main lg:flex-row">
            {/* ── Left column: catalog ── */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Sticky header */}
                <header className="sticky top-0 z-30 border-b border-divider bg-white/95 backdrop-blur-sm">
                    {/* Top row */}
                    <div className="flex items-center gap-3 px-4 pb-3 pt-4 lg:px-6">
                        <button
                            type="button"
                            onClick={() => router.push(routes.listDetail(listId))}
                            aria-label="Volver"
                            className="grid size-9 shrink-0 place-items-center rounded-xl bg-feedback-success-bg text-brand"
                        >
                            <ArrowLeft size={17}/>
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] text-text-muted">{listTitle}</p>
                            <h1 className="text-[18px] font-extrabold leading-tight tracking-tight text-text-primary">
                                Añadir productos
                            </h1>
                        </div>
                        {/* Desktop confirm shortcut */}
                        <AnimatePresence>
                            {selectedCount > 0 ? (
                                <motion.button
                                    key="header-confirm"
                                    type="button"
                                    initial={{opacity: 0, scale: 0.8}}
                                    animate={{opacity: 1, scale: 1}}
                                    exit={{opacity: 0, scale: 0.8}}
                                    onClick={handleConfirm}
                                    disabled={isSaving}
                                    className="hidden shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(57,184,107,0.3)] disabled:opacity-60 lg:flex"
                                >
                                    {isSaving ? (
                                        <span
                                            className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                                    ) : (
                                        <Check size={14} strokeWidth={3}/>
                                    )}
                                    Confirmar ({totalItems})
                                </motion.button>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    {/* Search */}
                    <div className="px-4 pb-3 lg:px-6">
                        <div className="flex items-center gap-2 rounded-2xl border border-divider bg-white px-3 py-2.5">
                            <Search size={16} className="shrink-0 text-text-muted"/>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar producto..."
                                className="min-w-0 flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="shrink-0"
                                    aria-label="Borrar búsqueda"
                                >
                                    <X size={15} className="text-text-muted"/>
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Category chips */}
                    <div className="px-4 pb-3 lg:px-6">
                        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                            <CategoryChip
                                id="all"
                                label="Todos"
                                active={activeCategoryId === "all"}
                                onClick={() => setActiveCategoryId("all")}
                            />
                            {categories.map((cat) => (
                                <CategoryChip
                                    key={cat}
                                    id={cat}
                                    label={cat}
                                    active={activeCategoryId === cat}
                                    onClick={() => setActiveCategoryId(cat)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Extra filter row — desktop only */}
                    <div className="hidden items-center gap-3 border-t border-divider px-6 py-2.5 lg:flex">
                        <Store size={13} className="shrink-0 text-text-muted"/>
                        <select
                            value={activeStoreId}
                            onChange={(e) => setActiveStoreId(e.target.value)}
                            className="bg-transparent text-[12px] text-text-muted outline-none"
                        >
                            <option value="all">Todas las tiendas</option>
                            {stores.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <div className="h-4 w-px bg-divider"/>
                        <SortAsc size={13} className="shrink-0 text-text-muted"/>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-transparent text-[12px] text-text-muted outline-none"
                        >
                            <option value="popular">Más populares</option>
                            <option value="price-asc">Menor precio</option>
                            <option value="savings">Mayor ahorro</option>
                            <option value="alpha">A → Z</option>
                        </select>
                        <div className="h-4 w-px bg-divider"/>
                        <button
                            type="button"
                            onClick={() => setShowOnlyAdded((v) => !v)}
                            className={cn(
                                "text-[12px] transition-colors",
                                showOnlyAdded ? "font-semibold text-brand" : "text-text-muted hover:text-text-primary",
                            )}
                        >
                            Solo añadidos{showOnlyAdded ? ` (${selectedCount})` : ""}
                        </button>
                    </div>
                </header>

                {/* Product grid */}
                <main className="flex-1 px-4 pb-32 pt-5 lg:px-6 lg:pb-10">
                    {filteredProducts.length === 0 ? (
                        <EmptyState query={query}/>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: {
                                    transition: {staggerChildren: prefersReduced ? 0 : 0.04},
                                },
                            }}
                        >
                            {filteredProducts.map((product) => {
                                const qty = selected[product.id] ?? 0;
                                const effectiveStore = getEffectiveStore(product);
                                const isExpanded = expandedProductId === product.id;

                                return (
                                    <motion.div
                                        key={product.id}
                                        variants={{
                                            hidden: {opacity: 0, y: prefersReduced ? 0 : 10},
                                            visible: {opacity: 1, y: 0},
                                        }}
                                        transition={{duration: 0.22}}
                                    >
                                        <ProductCard
                                            product={product}
                                            qty={qty}
                                            effectiveStore={effectiveStore}
                                            isExpanded={isExpanded}
                                            prefersReduced={!!prefersReduced}
                                            onAdd={() => handleAddProduct(product.id)}
                                            onRemove={() => handleRemoveProduct(product.id)}
                                            onQuantityChange={(v) => handleQuantityChange(product.id, v)}
                                            onToggleExpand={() =>
                                                setExpandedProductId(isExpanded ? null : product.id)
                                            }
                                            onStoreSelect={(storeName) =>
                                                handleStoreSelect(product.id, storeName)
                                            }
                                        />
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </main>
            </div>

            {/* ── Right panel — desktop only ── */}
            <AnimatePresence>
                {selectedCount > 0 ? (
                    <motion.aside
                        key="cart-panel"
                        initial={{x: prefersReduced ? 0 : 360, opacity: prefersReduced ? 0 : 1}}
                        animate={{x: 0, opacity: 1}}
                        exit={{x: prefersReduced ? 0 : 360, opacity: 0}}
                        transition={panelTransition}
                        className="sticky top-0 hidden h-dvh w-90 shrink-0 flex-col border-l border-divider bg-white lg:flex"
                    >
                        <CartPanelContent
                            listTitle={listTitle}
                            selected={selected}
                            totalItems={totalItems}
                            totalPrice={totalPrice}
                            isSaving={isSaving}
                            getEffectiveStore={getEffectiveStore}
                            onRemove={handleRemoveProduct}
                            onConfirm={handleConfirm}
                        />
                    </motion.aside>
                ) : null}
            </AnimatePresence>

            {/* ── Mobile bottom CTA ── */}
            <AnimatePresence>
                {selectedCount > 0 ? (
                    <motion.div
                        key="mobile-cta"
                        initial={{y: prefersReduced ? 0 : 80, opacity: prefersReduced ? 0 : 1}}
                        animate={{y: 0, opacity: 1}}
                        exit={{y: prefersReduced ? 0 : 80, opacity: 0}}
                        transition={ctaTransition}
                        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-divider bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-text-muted">{totalItems} productos</p>
                            <p className="text-[17px] font-extrabold text-text-primary">
                                {formatCurrency(totalPrice)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSaving}
                            className="flex shrink-0 items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(57,184,107,0.35)] disabled:opacity-60"
                        >
                            {isSaving ? (
                                <span
                                    className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                            ) : (
                                <Check size={16} strokeWidth={3}/>
                            )}
                            Confirmar
                        </button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function CategoryChip({
                          id,
                          label,
                          active,
                          onClick,
                      }: {
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            key={id}
            type="button"
            onClick={onClick}
            className={cn(
                "flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
                active
                    ? "border border-brand bg-[#F0FBF4] font-semibold text-brand"
                    : "border border-divider bg-white text-text-muted hover:border-brand/40",
            )}
        >
            {label}
        </button>
    );
}

type ProductCardProps = {
    product: CatalogProduct;
    qty: number;
    effectiveStore: ProductStore;
    isExpanded: boolean;
    prefersReduced: boolean;
    onAdd: () => void;
    onRemove: () => void;
    onQuantityChange: (v: number) => void;
    onToggleExpand: () => void;
    onStoreSelect: (storeName: string) => void;
};

function ProductCard({
                         product,
                         qty,
                         effectiveStore,
                         isExpanded,
                         prefersReduced,
                         onAdd,
                         onRemove,
                         onQuantityChange,
                         onToggleExpand,
                         onStoreSelect,
                     }: ProductCardProps) {
    const isAdded = qty > 0;
    const savings = getEstimatedSavings(product);
    const bestPrice = getBestPrice(product);

    return (
        <div>
            <motion.article
                whileHover={prefersReduced ? {} : {y: -2}}
                whileTap={prefersReduced ? {} : {scale: 0.98}}
                transition={{duration: 0.15}}
                className={cn(
                    "relative flex flex-col rounded-2xl border bg-white transition-shadow",
                    isAdded
                        ? "border-brand shadow-[0_4px_16px_rgba(57,184,107,0.14)]"
                        : "border-divider shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
                )}
            >
                {/* Remove × */}
                {isAdded ? (
                    <button
                        type="button"
                        onClick={onRemove}
                        aria-label={`Quitar ${product.name}`}
                        className="absolute right-2.5 top-2.5 z-10 grid size-6 place-items-center rounded-full bg-white shadow-sm text-text-muted transition-colors hover:text-red-500"
                    >
                        <X size={12} strokeWidth={2.5}/>
                    </button>
                ) : null}

                {/* Emoji area */}
                <div
                    className="relative flex h-36 items-center justify-center overflow-hidden rounded-t-2xl bg-[#F7F5F0]">
                    <span className="select-none text-[56px] leading-none">{product.emoji}</span>
                    {effectiveStore.isBestPrice ? (
                        <span
                            className="absolute left-2 top-2 rounded-full bg-feedback-success-bg px-2 py-0.5 text-[9px] font-bold text-brand-active">
                            Mejor precio
                        </span>
                    ) : null}
                    {isAdded ? (
                        <motion.div
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            className="absolute right-8 top-2 grid size-6 place-items-center rounded-full bg-brand"
                        >
                            <Check size={12} strokeWidth={3} className="text-white"/>
                        </motion.div>
                    ) : null}
                    <span
                        className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-text-muted backdrop-blur-sm">
                        🏪 {effectiveStore.storeName}
                    </span>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-text-primary">
                        {product.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                        {product.brand} · {product.unit}
                    </p>

                    {/* Price */}
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span
                            className={cn(
                                "text-[18px] font-extrabold tabular-nums",
                                effectiveStore.isBestPrice ? "text-brand-active" : "text-text-primary",
                            )}
                        >
                            {formatCurrency(effectiveStore.price)}
                        </span>
                        {savings > 0.01 ? (
                            <span className="text-[10px] font-medium text-brand-active">
                                hasta {formatCurrency(savings)} menos
                            </span>
                        ) : null}
                    </div>

                    {/* Store count toggle */}
                    {product.pricesByStore.length > 1 ? (
                        <button
                            type="button"
                            onClick={onToggleExpand}
                            className="mt-1 flex items-center gap-0.5 text-left text-[11px] text-brand hover:underline"
                        >
                            {product.pricesByStore.length} tiendas
                            {isExpanded ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                        </button>
                    ) : null}

                    {/* CTA */}
                    <div className="mt-3">
                        {qty === 0 ? (
                            <button
                                type="button"
                                onClick={onAdd}
                                className="w-full rounded-xl border border-brand py-2 text-[13px] font-bold text-brand transition-colors hover:bg-[#F0FBF4]"
                            >
                                Añadir
                            </button>
                        ) : (
                            <QuantityStepper
                                value={qty}
                                onChange={onQuantityChange}
                                min={1}
                                className="w-full"
                            />
                        )}
                    </div>
                </div>
            </motion.article>

            {/* Store prices dropdown */}
            <AnimatePresence>
                {isExpanded ? (
                    <motion.div
                        key="store-prices"
                        initial={{height: 0, opacity: 0}}
                        animate={{height: "auto", opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: prefersReduced ? 0 : 0.2, ease: "easeInOut"}}
                        className="overflow-hidden"
                    >
                        <StorePricesDropdown
                            product={product}
                            effectiveStore={effectiveStore}
                            bestPrice={bestPrice}
                            onSelect={onStoreSelect}
                        />
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function StorePricesDropdown({
                                 product,
                                 effectiveStore,
                                 bestPrice,
                                 onSelect,
                             }: {
    product: CatalogProduct;
    effectiveStore: ProductStore;
    bestPrice: number;
    onSelect: (storeName: string) => void;
}) {
    return (
        <div className="mt-1.5 rounded-2xl border border-divider bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <p className="mb-2 text-[11px] font-semibold text-text-muted">Comparar precios</p>
            <div className="flex flex-col gap-1.5">
                {product.pricesByStore
                    .slice()
                    .sort((a, b) => a.price - b.price)
                    .map((store) => {
                        const isChosen = store.storeName === effectiveStore.storeName;
                        const diff = store.price - bestPrice;
                        return (
                            <div
                                key={store.storeName}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-3 py-2 transition-colors",
                                    isChosen ? "bg-[#F0FBF4]" : "hover:bg-bg-hover",
                                )}
                            >
                                <span className="min-w-0 flex-1 text-[12px] font-medium text-text-primary">
                                    {store.storeName}
                                </span>
                                {store.isBestPrice ? (
                                    <span
                                        className="shrink-0 rounded-full bg-feedback-success-bg px-1.5 py-0.5 text-[9px] font-bold text-brand-active">
                                        MEJOR
                                    </span>
                                ) : (
                                    <span className="shrink-0 text-[11px] text-text-muted">
                                        +{formatCurrency(diff)}
                                    </span>
                                )}
                                <span
                                    className={cn(
                                        "shrink-0 text-[13px] font-bold tabular-nums",
                                        store.isBestPrice ? "text-brand-active" : "text-text-primary",
                                    )}
                                >
                                    {formatCurrency(store.price)}
                                </span>
                                {isChosen ? (
                                    <span
                                        className="ml-1 shrink-0 rounded-lg bg-feedback-success-bg px-2 py-1 text-[10px] font-bold text-brand">
                                        Elegida
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onSelect(store.storeName)}
                                        className="ml-1 shrink-0 rounded-lg bg-brand px-2 py-1 text-[10px] font-bold text-white"
                                    >
                                        Usar
                                    </button>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

function CartPanelContent({
                              listTitle,
                              selected,
                              totalItems,
                              totalPrice,
                              isSaving,
                              getEffectiveStore,
                              onRemove,
                              onConfirm,
                          }: {
    listTitle: string;
    selected: Record<string, number>;
    totalItems: number;
    totalPrice: number;
    isSaving: boolean;
    getEffectiveStore: (p: CatalogProduct) => ProductStore;
    onRemove: (id: string) => void;
    onConfirm: () => void;
}) {
    const selectedProducts = CATALOG_PRODUCTS.filter((p) => selected[p.id] !== undefined);

    return (
        <>
            <div className="border-b border-divider p-6">
                <div className="flex items-center gap-2">
                    <ShoppingCart size={18} className="text-brand"/>
                    <h2 className="text-[16px] font-bold text-text-primary">Tu selección</h2>
                </div>
                <p className="mt-0.5 text-[12px] text-text-muted">{listTitle}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-2">
                    {selectedProducts.map((product) => {
                        const qty = selected[product.id]!;
                        const store = getEffectiveStore(product);
                        return (
                            <div
                                key={product.id}
                                className="flex items-center gap-3 rounded-xl bg-bg-main p-3"
                            >
                                <span className="text-xl leading-none">{product.emoji}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12px] font-semibold text-text-primary">
                                        {product.name}
                                    </p>
                                    <p className="text-[11px] text-text-muted">
                                        {qty} × {formatCurrency(store.price)}
                                    </p>
                                </div>
                                <span className="shrink-0 text-[13px] font-bold text-text-primary">
                                    {formatCurrency(store.price * qty)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(product.id)}
                                    aria-label={`Quitar ${product.name}`}
                                    className="shrink-0 text-text-muted transition-colors hover:text-red-500"
                                >
                                    <X size={14}/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-divider p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-[13px] text-text-muted">{totalItems} productos</span>
                    <span className="text-[22px] font-extrabold text-text-primary">
                        {formatCurrency(totalPrice)}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(57,184,107,0.3)] transition-opacity disabled:opacity-60"
                >
                    {isSaving ? (
                        <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"/>
                    ) : (
                        <Check size={18} strokeWidth={3}/>
                    )}
                    {isSaving ? "Guardando..." : "Confirmar lista"}
                </button>
            </div>
        </>
    );
}

function EmptyState({query}: { query: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 text-[52px] leading-none">{query ? "🔍" : "🛒"}</span>
            <p className="text-[16px] font-semibold text-text-primary">
                {query ? "Sin resultados" : "Catálogo vacío"}
            </p>
            <p className="mt-1 max-w-60 text-[13px] text-text-muted">
                {query
                    ? `No encontramos productos para "${query}"`
                    : "No hay productos con los filtros actuales"}
            </p>
        </div>
    );
}
