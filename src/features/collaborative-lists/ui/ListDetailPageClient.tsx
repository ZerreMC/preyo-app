"use client";

import {useMemo, useRef, useState, useSyncExternalStore} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
    ArrowLeft, Check, ChevronDown, Lock, MapPin, Minus, Pencil,
    Plus, Search, Share2, ShoppingCart, Trash2, X,
} from "lucide-react";
import {AnimatePresence, motion} from "motion/react";
import {AvatarStack, Button} from "@/shared/ui";
import {routes} from "@/shared/config/routes";
import {formatCurrency} from "@/shared/lib";
import {
    deleteItem,
    getListById,
    setListLocked,
    subscribeToMockLists,
    toggleItemPurchased,
    updateItemQuantity,
    type MockListItem,
} from "../client";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SORT_OPTIONS = ["Manual", "Categoría", "Precio", "Estado"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const REALTIME_MSGS = [
    "Marc está editando…",
    "Júlia añadió 2 productos",
    "Anna marcó leche como comprada",
];

/* ------------------------------------------------------------------ */
/*  Toast hook (single toast, no overlap)                              */
/* ------------------------------------------------------------------ */

function useToast(duration = 2200) {
    const [msg, setMsg] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = (text: string) => {
        if (timer.current) clearTimeout(timer.current);
        setMsg(text);
        timer.current = setTimeout(() => setMsg(""), duration);
    };

    return {toast: msg, showToast: show};
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type ListDetailPageClientProps = {
    listId: string;
};

export function ListDetailPageClient({listId}: ListDetailPageClientProps) {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState("Todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>("Manual");
    const [showSort, setShowSort] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<MockListItem | null>(null);
    const {toast, showToast} = useToast();

    const list = useSyncExternalStore(
        subscribeToMockLists,
        () => getListById(listId),
        () => getListById(listId),
    );

    const stats = useMemo(() => {
        const items = list?.items ?? [];
        const purchased = items.filter((i) => i.purchased).length;
        const total = items.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);
        return {
            purchased,
            totalItems: items.length,
            total,
            progress: items.length > 0 ? Math.round((purchased / items.length) * 100) : 0,
        };
    }, [list]);

    const filters = useMemo(() => {
        const cats = Array.from(new Set((list?.items ?? []).map((i) => i.category)));
        return ["Todos", "Pendientes", "Comprados", ...cats];
    }, [list]);

    const filteredAndSorted = useMemo(() => {
        let items = list?.items ?? [];

        // text search
        if (searchQuery) {
            const q = searchQuery.trim().toLowerCase();
            items = items.filter((i) => i.name.toLowerCase().includes(q));
        }

        // filter chips
        items = items.filter((i) => {
            if (activeFilter === "Todos") return true;
            if (activeFilter === "Pendientes") return !i.purchased;
            if (activeFilter === "Comprados") return i.purchased;
            return i.category === activeFilter;
        });

        // sort
        if (sortBy === "Categoría") items = [...items].sort((a, b) => a.category.localeCompare(b.category));
        if (sortBy === "Precio") items = [...items].sort((a, b) => (b.estimatedPrice ?? 0) - (a.estimatedPrice ?? 0));
        if (sortBy === "Estado") items = [...items].sort((a, b) => Number(a.purchased) - Number(b.purchased));

        return items;
    }, [activeFilter, list, searchQuery, sortBy]);

    const groupedItems = useMemo(() => {
        return filteredAndSorted.reduce<Record<string, MockListItem[]>>((groups, item) => {
            const key = item.purchased && activeFilter === "Todos" ? "Comprados" : item.category;
            groups[key] = [...(groups[key] ?? []), item];
            return groups;
        }, {});
    }, [activeFilter, filteredAndSorted]);

    if (!list) {
        return (
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))]">
                <Button variant="secondary" onClick={() => router.push(routes.lists)}>
                    Volver a listas
                </Button>
            </div>
        );
    }

    const isLocked = Boolean(list.isLocked);

    const handleQuantity = (item: MockListItem, delta: number) => {
        if (isLocked) return;
        updateItemQuantity(list.id, item.id, item.quantity + delta);
    };

    const handleToggleLock = () => {
        setListLocked(list.id, !isLocked);
        showToast(isLocked ? "Lista desbloqueada" : "Lista bloqueada 🔒");
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        deleteItem(list.id, deleteTarget.id);
        showToast(`${deleteTarget.name.split(" ")[0]} eliminado`);
        setDeleteTarget(null);
    };

    return (
        <div className="min-h-dvh pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-36">
            {/* ── Header ── */}
            <header className="glass-medium sticky top-0 z-30 border-b border-white/40 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-3">
                {/* Top row */}
                <div className="mb-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push(routes.lists)}
                        className="grid size-9 place-items-center rounded-xl bg-[#ECF8EE] text-brand-active"
                        aria-label="Volver a listas"
                    >
                        <ArrowLeft size={17}/>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowSearch((v) => !v)}
                            className="grid size-9 place-items-center rounded-xl transition-colors"
                            style={{background: showSearch ? "#39B86B" : "#ECF8EE"}}
                            aria-label="Buscar"
                        >
                            <Search size={15} color={showSearch ? "white" : "#217A4B"}/>
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleLock}
                            className="grid size-9 place-items-center rounded-xl"
                            style={{background: isLocked ? "#FFF0F0" : "#ECF8EE"}}
                            aria-label={isLocked ? "Desbloquear lista" : "Bloquear lista"}
                        >
                            <Lock size={15} color={isLocked ? "#C94F45" : "#217A4B"}/>
                        </button>
                        <Link
                            href={routes.shareList(list.id)}
                            className="grid size-9 place-items-center rounded-xl bg-[#ECF8EE] text-brand-active"
                            aria-label="Compartir lista"
                        >
                            <Share2 size={15} color="#217A4B"/>
                        </Link>
                    </div>
                </div>

                {/* Title + total */}
                <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <button type="button" className="group flex items-center gap-2">
                            <h1 className="truncate text-[22px] font-extrabold tracking-[-0.4px] text-text-primary">
                                {list.title}
                            </h1>
                            <Pencil size={13} className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"/>
                        </button>
                        {/* Collaboration row */}
                        <div className="mt-1 flex items-center gap-2">
                            <AvatarStack avatars={list.collaborators} size="sm" max={4}/>
                            <div className="size-1.5 rounded-full bg-brand"/>
                            <span className="text-[11px] text-text-muted">
                                {REALTIME_MSGS[0]}
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-[22px] font-extrabold tabular-nums text-text-primary">
                            {formatCurrency(stats.total)}
                        </p>
                        <p className="text-[11px] text-text-muted">estimado</p>
                    </div>
                </div>

                {/* Locked banner */}
                {isLocked ? (
                    <div className="mb-3 rounded-2xl border border-[#FFD6D6] bg-[#FFF0F0] px-3 py-2 text-[12px] font-semibold text-error">
                        Lista bloqueada. La edición de productos está desactivada.
                    </div>
                ) : null}

                {/* Progress */}
                <div className="mb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-text-muted">
                            {stats.purchased} de {stats.totalItems} productos
                        </span>
                        <span className="text-[12px] font-bold text-brand">{stats.progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-divider">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-active"
                            initial={false}
                            animate={{width: `${stats.progress}%`}}
                            transition={{duration: 0.5, ease: "easeOut"}}
                        />
                    </div>
                </div>

                {/* Expandable search */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: "auto"}}
                            exit={{opacity: 0, height: 0}}
                            className="mb-2 overflow-hidden"
                        >
                            <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-brand/20 bg-bg-main px-4 py-2.5">
                                <Search size={15} className="shrink-0 text-text-muted"/>
                                <input
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar en esta lista…"
                                    className="min-w-0 flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted"
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => setSearchQuery("")}>
                                        <X size={14} className="text-text-muted"/>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filter chips + sort */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
                        {filters.map((f) => {
                            const active = activeFilter === f;
                            return (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setActiveFilter(f)}
                                    className={[
                                        "shrink-0 rounded-full px-3 py-1.5 text-[12px] transition-all",
                                        active
                                            ? "bg-brand font-bold text-white shadow-[0_4px_12px_rgba(57,184,107,0.25)]"
                                            : "border border-divider bg-white/70 font-medium text-text-muted",
                                    ].join(" ")}
                                >
                                    {f}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sort dropdown */}
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowSort((v) => !v)}
                            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                            style={{
                                background: sortBy !== "Manual" ? "#ECF8EE" : "rgba(255,255,255,0.7)",
                                color: sortBy !== "Manual" ? "#217A4B" : undefined,
                                borderColor: sortBy !== "Manual" ? "#CFF3DA" : "#E9E5DC",
                            }}
                        >
                            <ChevronDown size={12}/>
                            {sortBy}
                        </button>
                        <AnimatePresence>
                            {showSort && (
                                <motion.div
                                    initial={{opacity: 0, scale: 0.95, y: -4}}
                                    animate={{opacity: 1, scale: 1, y: 0}}
                                    exit={{opacity: 0, scale: 0.95, y: -4}}
                                    className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-2xl border border-divider bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                                >
                                    {SORT_OPTIONS.map((opt, i) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                                setSortBy(opt);
                                                setShowSort(false);
                                            }}
                                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-bg-soft"
                                            style={{
                                                color: opt === sortBy ? "#39B86B" : undefined,
                                                fontWeight: opt === sortBy ? 700 : 500,
                                                borderBottom: i < SORT_OPTIONS.length - 1 ? "1px solid #E9E5DC" : "none",
                                            }}
                                        >
                                            {opt}
                                            {opt === sortBy && <Check size={13} color="#39B86B"/>}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="px-5 pt-4">
                {list.items.length === 0 ? (
                    <EmptyListState listId={list.id}/>
                ) : Object.keys(groupedItems).length === 0 ? (
                    <p className="rounded-3xl border border-divider bg-white p-5 text-center text-sm text-text-muted">
                        No hay productos en este filtro.
                    </p>
                ) : (
                    Object.entries(groupedItems).map(([category, items]) => (
                        <section key={category} className="mb-5">
                            <div className="mb-2 flex items-center gap-2">
                                <h2 className="text-[13px] font-bold text-text-muted">
                                    {category === "Comprados" ? "✓" : items[0]?.categoryEmoji} {category}
                                </h2>
                                <div className="h-px flex-1 bg-divider"/>
                                <span className="text-[11px] text-text-muted">{items.length}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {items.map((item) => (
                                    <ProductRow
                                        key={item.id}
                                        item={item}
                                        locked={isLocked}
                                        onToggle={() => !isLocked && toggleItemPurchased(list.id, item.id)}
                                        onMinus={() => handleQuantity(item, -1)}
                                        onPlus={() => handleQuantity(item, 1)}
                                        onDelete={() => setDeleteTarget(item)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            {/* ── Orange "Compra en curso" pill ── */}
            <motion.button
                type="button"
                onClick={() => router.push(routes.planRoute(list.id))}
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.5}}
                className="fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5"
                style={{
                    bottom: "calc(7.5rem + env(safe-area-inset-bottom))",
                    background: "linear-gradient(135deg, #FF8A3D, #E05C30)",
                    boxShadow: "0 6px 20px rgba(255,138,61,0.40)",
                    whiteSpace: "nowrap",
                }}
            >
                <ShoppingCart size={14} color="white" strokeWidth={2.5}/>
                <span className="text-[13px] font-bold text-white">Compra en curso</span>
                <div className="size-2 animate-pulse rounded-full bg-white"/>
            </motion.button>

            {/* ── Sticky bottom CTA ── */}
            <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px]">
                <div className="glass-strong border-t border-white/50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <div className="flex gap-3">
                        <motion.button
                            type="button"
                            whileTap={{scale: 0.97}}
                            onClick={() => router.push(routes.addProducts(list.id))}
                            disabled={isLocked}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#CFF3DA] bg-[#ECF8EE] py-3.5 text-[14px] font-bold text-brand-active disabled:opacity-50"
                        >
                            <Plus size={17} strokeWidth={2.5}/>
                            Añadir producto
                        </motion.button>
                        <motion.button
                            type="button"
                            whileTap={{scale: 0.97}}
                            onClick={() => router.push(routes.planRoute(list.id))}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(57,184,107,0.30)] disabled:opacity-70"
                            style={{background: "linear-gradient(135deg, #39B86B, #217A4B)"}}
                        >
                            <MapPin size={17} strokeWidth={2.5}/>
                            Planificar compra
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ── Delete confirmation modal ── */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 z-50 flex items-end justify-center px-5 pb-8"
                        style={{background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)"}}
                        onClick={() => setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{y: 60, scale: 0.97}}
                            animate={{y: 0, scale: 1}}
                            exit={{y: 60, scale: 0.97}}
                            transition={{type: "spring", stiffness: 400, damping: 32}}
                            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#FFF0F0]">
                                <Trash2 size={20} className="text-error"/>
                            </div>
                            <h3 className="mb-1 text-center text-[18px] font-extrabold text-text-primary">
                                ¿Eliminar producto?
                            </h3>
                            <p className="mb-6 text-center text-[13px] text-text-muted">
                                Esta acción quitará <strong>{deleteTarget.name}</strong> de la lista.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 rounded-2xl bg-divider py-3 text-[14px] font-semibold text-text-primary"
                                >
                                    Cancelar
                                </button>
                                <motion.button
                                    type="button"
                                    whileTap={{scale: 0.97}}
                                    onClick={confirmDelete}
                                    className="flex-1 rounded-2xl bg-error py-3 text-[14px] font-bold text-white"
                                >
                                    Eliminar
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{opacity: 0, y: 32}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 32}}
                        className="fixed bottom-36 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 items-center gap-3 rounded-2xl bg-text-primary px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                    >
                        <Check size={15} className="shrink-0 text-brand"/>
                        <p className="text-[13px] font-semibold text-white">{toast}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  ProductRow                                                         */
/* ------------------------------------------------------------------ */

function ProductRow({
    item,
    locked,
    onToggle,
    onMinus,
    onPlus,
    onDelete,
}: {
    item: MockListItem;
    locked: boolean;
    onToggle: () => void;
    onMinus: () => void;
    onPlus: () => void;
    onDelete: () => void;
}) {
    return (
        <motion.article
            layout
            className={[
                "flex items-center gap-3 rounded-2xl border border-divider bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]",
                item.purchased ? "opacity-65" : "",
            ].join(" ")}
        >
            {/* Checkbox */}
            <button
                type="button"
                onClick={onToggle}
                disabled={locked}
                className={[
                    "grid size-7 shrink-0 place-items-center rounded-xl border-2 transition disabled:cursor-not-allowed",
                    item.purchased ? "border-brand bg-brand text-white" : "border-divider bg-transparent text-transparent",
                ].join(" ")}
                aria-label={item.purchased ? "Marcar como pendiente" : "Marcar como comprado"}
            >
                <Check size={14} strokeWidth={3}/>
            </button>

            {/* Image / emoji fallback */}
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-bg-soft text-xl">
                {item.image ? null : item.categoryEmoji}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className={["truncate text-[13px] font-semibold text-text-primary", item.purchased ? "line-through" : ""].join(" ")}>
                    {item.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden">
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#ECF8EE] px-1.5 py-0.5 text-[10px] font-semibold text-brand-active">
                        {item.categoryEmoji} {item.category}
                    </span>
                    {item.estimatedPrice ? (
                        <span className="shrink-0 text-[11px] font-bold text-brand">
                            {formatCurrency(item.estimatedPrice * item.quantity)}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Qty stepper */}
            {!locked && (
                <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={onMinus} disabled={item.quantity <= 1} className="grid size-6 place-items-center rounded-lg bg-divider text-text-muted disabled:opacity-40">
                        <Minus size={11} strokeWidth={2.5}/>
                    </button>
                    <span className="w-5 text-center text-[13px] font-extrabold text-text-primary">{item.quantity}</span>
                    <button type="button" onClick={onPlus} className="grid size-6 place-items-center rounded-lg bg-[#ECF8EE] text-brand-active">
                        <Plus size={11} strokeWidth={2.5}/>
                    </button>
                </div>
            )}

            {/* Delete */}
            {!locked && (
                <button type="button" onClick={onDelete} className="grid size-7 shrink-0 place-items-center rounded-xl bg-[#FFF0F0] text-error" aria-label="Eliminar producto">
                    <Trash2 size={12}/>
                </button>
            )}
        </motion.article>
    );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyListState({listId}: {listId: string}) {
    return (
        <div className="rounded-3xl border border-divider bg-white px-6 py-14 text-center shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="mb-4 text-5xl">🛒</div>
            <h2 className="mb-2 text-[18px] font-bold text-text-primary">Lista vacía</h2>
            <p className="mx-auto mb-6 max-w-64 text-sm text-text-muted">
                Añade productos para preparar la compra colaborativa.
            </p>
            <Link href={routes.addProducts(listId)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-3xl bg-brand px-5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(57,184,107,0.3)]">
                <Plus size={17}/>
                Añadir producto
            </Link>
        </div>
    );
}
