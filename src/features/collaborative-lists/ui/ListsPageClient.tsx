"use client";

import {useMemo, useState, useTransition} from "react";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {Check, Grid3x3, List, Plus, Search, X} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ListCard} from "@/entities/shopping-list";
import {routes} from "@/shared/config/routes";
import {Button, Input} from "@/shared/ui";
import {createClient} from "@/shared/api/supabase/browserClient";
import {cn} from "@/shared/lib";
import {
    CreateListCommandHandler,
    SupabaseListRepository,
    type ShoppingListSummary,
    type Uuid,
} from "@/features/collaborative-lists";

type ListsPageClientProps = {
    lists: ShoppingListSummary[];
};

type StatusFilter = "all" | "active" | "completed" | "draft";
type ViewMode = "grid" | "list";

const statusEmoji: Record<ShoppingListSummary["status"], string> = {
    draft:     "📝",
    active:    "🛒",
    shopping:  "🛍️",
    completed: "✅",
    archived:  "🔒",
};

const listCategories = [
    {id: "semanal",  emoji: "🛒",  label: "Semanal"},
    {id: "cena",     emoji: "🍽️", label: "Cena"},
    {id: "especial", emoji: "🎉",  label: "Especial"},
    {id: "salud",    emoji: "🥗",  label: "Salud"},
    {id: "bebe",     emoji: "🍼",  label: "Bebé"},
    {id: "casa",     emoji: "🏠",  label: "Casa"},
    {id: "evento",   emoji: "🥂",  label: "Evento"},
] as const;

function isReadOnlyStatus(status: ShoppingListSummary["status"]) {
    return status === "completed" || status === "archived";
}

const STATUS_FILTERS: {id: StatusFilter; label: string}[] = [
    {id: "all",       label: "Todas"},
    {id: "active",    label: "Activa"},
    {id: "completed", label: "Completada"},
    {id: "draft",     label: "Borrador"},
];

export function ListsPageClient({lists}: ListsPageClientProps) {
    const router = useRouter();
    const prefersReduced = useReducedMotion();

    const [items, setItems] = useState(lists);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [categoryId, setCategoryId] = useState<(typeof listCategories)[number]["id"]>("semanal");
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const activeCount = useMemo(
        () => items.filter((l) => l.status === "active" || l.status === "shopping").length,
        [items],
    );

    const filteredLists = useMemo(() => {
        let result = items;
        const query = searchQuery.trim().toLowerCase();
        if (query) result = result.filter((l) => l.title.toLowerCase().includes(query));
        if (statusFilter === "active")    result = result.filter((l) => l.status === "active" || l.status === "shopping");
        if (statusFilter === "completed") result = result.filter((l) => l.status === "completed" || l.status === "archived");
        if (statusFilter === "draft")     result = result.filter((l) => l.status === "draft");
        return result;
    }, [items, searchQuery, statusFilter]);

    const selectedCategory = listCategories.find((c) => c.id === categoryId) ?? listCategories[0];

    const closeCreateSheet = () => {
        if (isPending) return;
        setCreateOpen(false);
        setNewTitle("");
        setCategoryId("semanal");
        setFormError(null);
    };

    const handleCreate = () => {
        const title = newTitle.trim();
        if (!title) {
            setFormError("El nombre de la lista es obligatorio.");
            return;
        }
        setFormError(null);
        startTransition(async () => {
            try {
                const supabase = createClient();
                const repository = new SupabaseListRepository(supabase);
                const result = await new CreateListCommandHandler(repository).execute({
                    title,
                    listId: crypto.randomUUID() as Uuid,
                    commandId: crypto.randomUUID() as Uuid,
                });
                if (!result.ok) {
                    setFormError(
                        result.error.kind === "UNAUTHORIZED"
                            ? "Sesión expirada. Recarga la página."
                            : result.error.kind === "INVALID_INPUT" && result.error.message
                                ? result.error.message
                                : "No se pudo crear la lista.",
                    );
                    return;
                }
                const nextLists = await repository.getLists();
                setItems(nextLists);
                setCreateOpen(false);
                setNewTitle("");
                setCategoryId("semanal");
                router.push(routes.listDetail(result.value.id));
            } catch (error) {
                setFormError(error instanceof Error ? error.message : "No se pudo crear la lista.");
            }
        });
    };

    return (
        <div className="min-h-dvh bg-bg-main pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-5 lg:px-7">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-text-primary">
                            Mis Listas
                        </h1>
                        <p className="text-[14px] text-text-muted">
                            {activeCount > 0
                                ? `${activeCount} lista${activeCount !== 1 ? "s" : ""} activa${activeCount !== 1 ? "s" : ""}`
                                : "Sin listas activas"}
                        </p>
                    </div>
                    <motion.button
                        type="button"
                        whileHover={prefersReduced ? {} : {scale: 1.02}}
                        whileTap={prefersReduced ? {} : {scale: 0.97}}
                        onClick={() => setCreateOpen(true)}
                        className="mt-1 flex shrink-0 items-center gap-2 rounded-xl bg-brand-active px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_2px_10px_rgba(46,125,50,0.3)]"
                        aria-label="Nueva lista"
                    >
                        <Plus size={16} strokeWidth={2.5}/>
                        Nueva lista
                    </motion.button>
                </div>
            </div>

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="space-y-3 px-5 pb-5 lg:px-7">
                <Input
                    leftIcon={Search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar lista..."
                    aria-label="Buscar en mis listas"
                />

                <div className="flex items-center gap-2">
                    {/* Status filter — segmented control estilo Webdesignpreyo */}
                    <div className="flex flex-1 items-center gap-0.5 overflow-x-auto rounded-[10px] bg-bg-hover p-1 [scrollbar-width:none]">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setStatusFilter(f.id)}
                                className={cn(
                                    "shrink-0 rounded-[8px] px-3 py-1.5 text-[13px] transition-all duration-150",
                                    statusFilter === f.id
                                        ? "bg-white font-bold text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                                        : "bg-transparent font-medium text-text-muted hover:text-text-primary",
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* View toggle — segmented control */}
                    <div className="flex shrink-0 items-center gap-0.5 rounded-[10px] bg-bg-hover p-1">
                        <button
                            type="button"
                            aria-label="Vista cuadrícula"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "grid size-9 place-items-center rounded-[7px] transition-all duration-150",
                                viewMode === "grid"
                                    ? "bg-white text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                                    : "bg-transparent text-text-muted hover:text-text-primary",
                            )}
                        >
                            <Grid3x3 size={15}/>
                        </button>
                        <button
                            type="button"
                            aria-label="Vista lista"
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "grid size-9 place-items-center rounded-[7px] transition-all duration-150",
                                viewMode === "list"
                                    ? "bg-white text-text-primary shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                                    : "bg-transparent text-text-muted hover:text-text-primary",
                            )}
                        >
                            <List size={15}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Contenido ──────────────────────────────────────────── */}
            {filteredLists.length === 0 && searchQuery ? (
                <div className="px-5 lg:px-7">
                    <EmptySearchState query={searchQuery}/>
                </div>
            ) : filteredLists.length === 0 ? (
                <div className="px-5 lg:px-7">
                    <EmptyState onCreate={() => setCreateOpen(true)}/>
                </div>
            ) : viewMode === "grid" ? (
                /* ── Vista cuadrícula ─────────────────────────────────── */
                <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2 xl:grid-cols-3 lg:px-7">
                    {filteredLists.map((list, i) => (
                        <motion.div
                            key={list.id}
                            initial={{opacity: 0, y: prefersReduced ? 0 : 14}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.3, delay: prefersReduced ? 0 : i * 0.06}}
                            whileHover={prefersReduced ? {} : {y: -3}}
                            whileTap={{scale: 0.98}}
                            className="h-full"
                        >
                            <Link
                                href={routes.listDetail(list.id)}
                                className="block h-full"
                                aria-label={`Abrir ${list.title}`}
                            >
                                <ListCard
                                    variant="grid"
                                    list={{
                                        id: list.id,
                                        title: list.title,
                                        categoryEmoji: statusEmoji[list.status],
                                        status: list.status,
                                        itemCount: list.itemCount,
                                        checkedCount: list.checkedCount,
                                        totalPrice: null,
                                        estimatedSavings: null,
                                        progressPct: list.itemCount > 0
                                            ? Math.round((list.checkedCount / list.itemCount) * 100)
                                            : 0,
                                        collaborators: list.collaborators,
                                        isLocked: isReadOnlyStatus(list.status),
                                        updatedAt: list.updatedAt,
                                    }}
                                    className="h-full shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                                />
                            </Link>
                        </motion.div>
                    ))}

                    {/* Dashed "Nueva lista" card al final del grid */}
                    <motion.button
                        type="button"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: prefersReduced ? 0 : filteredLists.length * 0.06 + 0.1}}
                        onClick={() => setCreateOpen(true)}
                        aria-label="Crear nueva lista"
                        className="flex min-h-[180px] flex-col items-center justify-center gap-2.5 rounded-[18px] border-2 border-dashed border-[#D1D1D6] p-5 transition-colors hover:border-[#A5D6A7] hover:bg-[#F9FBF9]"
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-bg-hover">
                            <Plus size={20} className="text-text-muted"/>
                        </div>
                        <p className="text-[14px] font-semibold text-text-muted">Nueva lista</p>
                    </motion.button>
                </div>
            ) : (
                /* ── Vista lista / tabla ─────────────────────────────── */
                <div className="mx-5 overflow-hidden rounded-[18px] border border-divider bg-white lg:mx-7">
                    {/* Cabeceras */}
                    <div
                        className="grid items-center border-b border-[#F5F5F5] bg-[#FAFAFA] px-5 py-3"
                        style={{gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr"}}
                    >
                        {["Lista", "Estado", "Total", "Ahorro", "Actualizada"].map((h, idx) => (
                            <span
                                key={h}
                                className={cn(
                                    "text-[11px] font-bold uppercase tracking-[0.07em] text-text-muted",
                                    idx >= 2 && "text-right",
                                )}
                            >
                                {h}
                            </span>
                        ))}
                    </div>

                    {filteredLists.map((list, i) => (
                        <motion.div
                            key={list.id}
                            initial={{opacity: 0, x: prefersReduced ? 0 : -8}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: prefersReduced ? 0 : i * 0.04}}
                            whileHover={{backgroundColor: "#F9F8F6"}}
                        >
                            <Link
                                href={routes.listDetail(list.id)}
                                className="block"
                                aria-label={`Abrir ${list.title}`}
                            >
                                <ListCard
                                    variant="row"
                                    list={{
                                        id: list.id,
                                        title: list.title,
                                        categoryEmoji: statusEmoji[list.status],
                                        status: list.status,
                                        itemCount: list.itemCount,
                                        checkedCount: list.checkedCount,
                                        totalPrice: null,
                                        estimatedSavings: null,
                                        progressPct: list.itemCount > 0
                                            ? Math.round((list.checkedCount / list.itemCount) * 100)
                                            : 0,
                                        collaborators: list.collaborators,
                                        isLocked: isReadOnlyStatus(list.status),
                                        updatedAt: list.updatedAt,
                                    }}
                                />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Modal crear lista ───────────────────────────────────── */}
            <AnimatePresence>
                {isCreateOpen ? (
                    <motion.div
                        className="fixed inset-0 z-80 flex flex-col justify-end bg-text-primary/45 backdrop-blur-sm"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) closeCreateSheet();
                        }}
                    >
                        <motion.form
                            initial={{y: "100%", opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            exit={{y: "100%", opacity: 0}}
                            transition={{type: "spring", stiffness: 280, damping: 32}}
                            className="max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-bg-main shadow-[0_-8px_48px_rgba(0,0,0,0.18)]"
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCreate();
                            }}
                        >
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="h-1 w-10 rounded-full bg-divider"/>
                            </div>

                            <div className="px-5 pt-2 pb-[max(2.5rem,calc(2rem+env(safe-area-inset-bottom)))]">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-[22px] font-black tracking-normal text-text-primary">
                                            Nueva lista
                                        </h2>
                                        <p className="text-[13px] text-text-muted">
                                            Organiza tu próxima compra
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeCreateSheet}
                                        className="grid size-9 place-items-center rounded-xl bg-brand/14 text-text-muted"
                                        aria-label="Cerrar"
                                    >
                                        <X size={17}/>
                                    </button>
                                </div>

                                <div className="mb-5">
                                    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
                                        Nombre de la lista
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-divider bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/10">
                                        <span className="text-xl">{selectedCategory.emoji}</span>
                                        <input
                                            autoFocus
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="Ej: Compra semanal..."
                                            className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
                                        />
                                    </div>
                                    {formError ? (
                                        <p role="alert" className="mt-1 ml-1 text-[11px] text-error">
                                            {formError}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="mb-5">
                                    <h3 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
                                        Categoría
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {listCategories.map((category) => {
                                            const active = category.id === categoryId;
                                            return (
                                                <motion.button
                                                    key={category.id}
                                                    type="button"
                                                    whileTap={{scale: 0.93}}
                                                    onClick={() => setCategoryId(category.id)}
                                                    className={[
                                                        "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] p-2.5 transition-all",
                                                        active
                                                            ? "border-brand bg-brand/14 shadow-[0_4px_12px_rgba(57,184,107,0.15)]"
                                                            : "border-divider bg-white",
                                                    ].join(" ")}
                                                >
                                                    <span className="text-xl">{category.emoji}</span>
                                                    <span className={active
                                                        ? "text-center text-[10px] font-bold leading-tight text-brand-active"
                                                        : "text-center text-[10px] font-medium leading-tight text-text-muted"}>
                                                        {category.label}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        fullWidth
                                        size="lg"
                                        className="rounded-2xl"
                                        onClick={closeCreateSheet}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="lg"
                                        className="rounded-2xl"
                                        disabled={!newTitle.trim()}
                                        loading={isPending}
                                    >
                                        {!isPending ? <Check size={17} strokeWidth={3}/> : null}
                                        Guardar lista
                                    </Button>
                                </div>
                            </div>
                        </motion.form>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function EmptyState({onCreate}: {onCreate: () => void}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 text-5xl">🛒</div>
            <h2 className="mb-2 text-[18px] font-bold text-text-primary">Aún no tienes listas</h2>
            <p className="mb-6 text-[14px] text-text-muted">Crea tu primera lista para organizar la compra.</p>
            <Button onClick={onCreate} size="lg">
                Crear mi primera lista
            </Button>
        </div>
    );
}

function EmptySearchState({query}: {query: string}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 text-5xl">🔍</div>
            <h2 className="mb-2 text-[18px] font-bold text-text-primary">Sin resultados</h2>
            <p className="text-[14px] text-text-muted">
                No encontramos listas para{" "}
                <span className="font-semibold text-text-primary">&ldquo;{query}&rdquo;</span>
            </p>
        </div>
    );
}
