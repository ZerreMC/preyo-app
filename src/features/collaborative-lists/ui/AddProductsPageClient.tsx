"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft, Check, Minus, Plus, Search, X} from "lucide-react";
import {AnimatePresence, motion} from "motion/react";
import {routes} from "@/shared/config/routes";
import {formatCurrency} from "@/shared/lib";
import {addProductsToList, mockProducts} from "../client";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SECTIONS = [
    {id: "suggested", label: "Sugeridos para ti", emoji: "✨", ids: ["tomate-rama", "leche-entera", "yogur-natural", "arroz-redondo"]},
    {id: "popular", label: "Más comprados", emoji: "🔥", ids: ["aceite-oliva", "pollo-filetes", "pasta-macarron", "salmon"]},
    {id: "recent", label: "Recientes", emoji: "🕐", ids: ["lechuga-romana", "detergente"]},
] as const;

/* ------------------------------------------------------------------ */
/*  Toast hook                                                         */
/* ------------------------------------------------------------------ */

function useToast(duration = 1800) {
    const [msg, setMsg] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const show = (text: string) => {
        if (timer.current) clearTimeout(timer.current);
        setMsg(text);
        timer.current = setTimeout(() => setMsg(""), duration);
    };
    return {toast: msg, showToast: show};
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

type AddProductsPageClientProps = {
    listId: string;
};

export function AddProductsPageClient({listId}: AddProductsPageClientProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [selected, setSelected] = useState<Record<string, number>>({});
    const {toast, showToast} = useToast();

    const categories = useMemo(
        () => ["Todos", ...Array.from(new Set(mockProducts.map((p) => p.category)))],
        [],
    );

    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        return mockProducts.filter((p) => {
            const matchQ = !q || p.name.toLowerCase().includes(q);
            const matchC = activeCategory === "Todos" || p.category === activeCategory;
            return matchQ && matchC;
        });
    }, [activeCategory, query]);

    const totalSelected = Object.values(selected).reduce((t, qty) => t + qty, 0);

    const updateSelection = (productId: string, delta: number) => {
        const product = mockProducts.find((p) => p.id === productId);
        setSelected((cur) => {
            const next = {...cur};
            const qty = Math.max(0, (cur[productId] ?? 0) + delta);
            if (qty === 0) delete next[productId];
            else next[productId] = qty;
            return next;
        });
        if (delta > 0 && product) {
            showToast(`${product.name.split(" ").slice(0, 3).join(" ")} añadido ✓`);
        }
    };

    const handleAdd = () => {
        const products = Object.entries(selected).map(([productId, quantity]) => ({productId, quantity}));
        if (products.length === 0) return;
        addProductsToList(listId, products);
        router.push(routes.listDetail(listId));
    };

    const isSearching = query.length > 0;
    const isFiltering = activeCategory !== "Todos";

    return (
        <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-bg-main pb-10 shadow-[0_0_40px_rgba(31,42,36,0.05)]">
            {/* ── Header ── */}
            <header className="glass-medium sticky top-0 z-30 border-b border-white/40 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-3">
                <div className="mb-3 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push(routes.listDetail(listId))}
                        className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#ECF8EE] text-brand-active"
                        aria-label="Volver al detalle"
                    >
                        <ArrowLeft size={17} color="#217A4B"/>
                    </button>
                    <h1 className="min-w-0 flex-1 text-[20px] font-extrabold tracking-[-0.3px] text-text-primary">
                        Añadir productos
                    </h1>
                    {totalSelected > 0 ? (
                        <motion.button
                            type="button"
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            whileTap={{scale: 0.95}}
                            onClick={handleAdd}
                            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(57,184,107,0.35)]"
                            style={{background: "linear-gradient(135deg, #39B86B, #217A4B)"}}
                        >
                            <Check size={14} strokeWidth={3}/>
                            Guardar ({totalSelected})
                        </motion.button>
                    ) : null}
                </div>

                {/* Search */}
                <div className="mb-3 flex items-center gap-3 rounded-2xl border-[1.5px] border-divider bg-white px-4 py-2.5">
                    <Search size={17} className="shrink-0 text-text-muted"/>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar producto…"
                        className="min-w-0 flex-1 bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted"
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery("")}>
                            <X size={15} className="text-text-muted"/>
                        </button>
                    )}
                </div>

                {/* Category chips */}
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                    {categories.map((cat) => {
                        const active = activeCategory === cat;
                        const emoji = mockProducts.find((p) => p.category === cat)?.categoryEmoji;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={[
                                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-all",
                                    active
                                        ? "bg-brand font-bold text-white shadow-[0_4px_12px_rgba(57,184,107,0.25)]"
                                        : "border border-divider bg-white/70 font-medium text-text-muted",
                                ].join(" ")}
                            >
                                {emoji ? <span>{emoji}</span> : null}
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{opacity: 0, y: -20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        className="fixed left-1/2 top-4 z-50 flex w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 items-center gap-2 rounded-2xl bg-brand-active px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                    >
                        <Check size={14} className="shrink-0 text-[#CFF3DA]" strokeWidth={3}/>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Content ── */}
            <main className="px-5 pt-4">
                {isSearching ? (
                    <>
                        <SectionLabel label={`Resultados para "${query}"`} emoji="🔍" count={filteredProducts.length}/>
                        <ProductGrid products={filteredProducts} selected={selected} onUpdate={updateSelection}/>
                    </>
                ) : isFiltering ? (
                    <ProductGrid products={filteredProducts} selected={selected} onUpdate={updateSelection}/>
                ) : (
                    <>
                        {SECTIONS.map((section) => {
                            const products = mockProducts.filter((p) => (section.ids as readonly string[]).includes(p.id));
                            if (products.length === 0) return null;
                            return (
                                <div key={section.id} className="mb-6">
                                    <SectionLabel label={section.label} emoji={section.emoji} count={products.length}/>
                                    <ProductGrid products={products} selected={selected} onUpdate={updateSelection}/>
                                </div>
                            );
                        })}
                    </>
                )}
            </main>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionLabel({label, emoji, count}: {label: string; emoji: string; count: number}) {
    return (
        <div className="mb-3 flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <span className="text-[15px] font-bold text-text-primary">{label}</span>
            <div className="h-px flex-1 bg-divider"/>
            <span className="text-[11px] text-text-muted">{count}</span>
        </div>
    );
}

function ProductGrid({
    products,
    selected,
    onUpdate,
}: {
    products: typeof mockProducts;
    selected: Record<string, number>;
    onUpdate: (id: string, delta: number) => void;
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {products.map((product) => {
                const qty = selected[product.id] ?? 0;
                const isAdded = qty > 0;
                return (
                    <motion.article
                        key={product.id}
                        whileTap={{scale: 0.98}}
                        className={[
                            "overflow-hidden rounded-3xl border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all",
                            isAdded ? "border-brand shadow-[0_6px_20px_rgba(57,184,107,0.14)]" : "border-divider",
                        ].join(" ")}
                    >
                        {/* Image area */}
                        <div className="relative grid h-[108px] place-items-center bg-bg-soft">
                            <span className="text-[30px] leading-none">{product.categoryEmoji}</span>
                            {isAdded ? (
                                <motion.div
                                    initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-brand text-white"
                                >
                                    <Check size={12} strokeWidth={3}/>
                                </motion.div>
                            ) : null}
                            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-text-muted backdrop-blur-sm">
                                🏪 {product.source}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                            <p className="line-clamp-2 min-h-8 text-[12px] font-semibold leading-tight text-text-primary">
                                {product.name}
                            </p>
                            <p className="mt-1 text-[11px] text-text-muted">{product.categoryEmoji} {product.unit}</p>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <p className="text-[17px] font-extrabold tabular-nums text-text-primary">
                                    {formatCurrency(product.estimatedPrice)}
                                </p>
                                {qty === 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => onUpdate(product.id, 1)}
                                        className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-[0_4px_12px_rgba(57,184,107,0.3)]"
                                        aria-label={`Añadir ${product.name}`}
                                    >
                                        <Plus size={18} strokeWidth={2.5}/>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 rounded-xl bg-[#ECF8EE] px-1.5 py-1">
                                        <button type="button" onClick={() => onUpdate(product.id, -1)} className="grid size-6 place-items-center rounded-lg bg-white text-brand-active">
                                            <Minus size={11} strokeWidth={2.5}/>
                                        </button>
                                        <span className="w-5 text-center text-[13px] font-extrabold text-brand-active">{qty}</span>
                                        <button type="button" onClick={() => onUpdate(product.id, 1)} className="grid size-6 place-items-center rounded-lg bg-brand text-white">
                                            <Plus size={11} strokeWidth={2.5}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.article>
                );
            })}
        </div>
    );
}
