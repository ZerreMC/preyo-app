"use client";

import {useMemo, useState, useTransition} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Check, LayoutGrid, List, Plus, Search, X} from "lucide-react";
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
    draft: "📝",
    active: "🛒",
    shopping: "🛍️",
    completed: "✅",
    archived: "🔒",
};

const listCategories = [
    {id: "semanal", emoji: "🛒", label: "Semanal"},
    {id: "cena", emoji: "🍽️", label: "Cena"},
    {id: "especial", emoji: "🎉", label: "Especial"},
    {id: "salud", emoji: "🥗", label: "Salud"},
    {id: "bebe", emoji: "🍼", label: "Bebé"},
    {id: "casa", emoji: "🏠", label: "Casa"},
    {id: "evento", emoji: "🥂", label: "Evento"},
] as const;

function isReadOnlyStatus(status: ShoppingListSummary["status"]) {
    return status === "completed" || status === "archived";
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    {id: "all", label: "Todas"},
    {id: "active", label: "Activa"},
    {id: "completed", label: "Completada"},
    {id: "draft", label: "Borrador"},
];

export function ListsPageClient({lists}: ListsPageClientProps) {
    const router = useRouter();
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
        if (statusFilter === "active") result = result.filter((l) => l.status === "active" || l.status === "shopping");
        if (statusFilter === "completed") result = result.filter((l) => l.status === "completed" || l.status === "archived");
        if (statusFilter === "draft") result = result.filter((l) => l.status === "draft");
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
                    console.error("[CreateList] error:", result.error);
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
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-[26px] font-extrabold tracking-normal text-text-primary">
                            Mis Listas
                        </h1>
                        <p className="text-[13px] text-text-muted">
                            {activeCount > 0
                                ? `${activeCount} lista${activeCount !== 1 ? "s" : ""} activa${activeCount !== 1 ? "s" : ""}`
                                : "Sin listas activas"}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        leftIcon={<Plus size={15}/>}
                        className="mt-1 h-10 min-w-fit shrink-0 flex-row flex-nowrap whitespace-nowrap rounded-2xl px-4 text-[13px]"
                        onClick={() => setCreateOpen(true)}
                    >
                        Nueva lista
                    </Button>
                </div>
            </div>

            {/* ── Toolbar: buscador + filtros + toggle ───────────────── */}
            <div className="space-y-3 px-5 pb-4">
                <Input
                    leftIcon={Search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar lista..."
                    aria-label="Buscar en mis listas"
                />

                <div className="flex items-center gap-2">
                    {/* Filter pills */}
                    <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setStatusFilter(f.id)}
                                className={cn(
                                    "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                                    statusFilter === f.id
                                        ? "bg-brand text-white"
                                        : "bg-bg-hover text-text-muted hover:text-text-primary",
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* View toggle */}
                    <div className="flex shrink-0 items-center gap-1 rounded-xl bg-bg-hover p-1">
                        <button
                            type="button"
                            aria-label="Vista cuadrícula"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "grid size-7 place-items-center rounded-lg transition-colors",
                                viewMode === "grid"
                                    ? "bg-brand/14 text-brand"
                                    : "text-text-muted hover:text-text-primary",
                            )}
                        >
                            <LayoutGrid size={15}/>
                        </button>
                        <button
                            type="button"
                            aria-label="Vista lista"
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "grid size-7 place-items-center rounded-lg transition-colors",
                                viewMode === "list"
                                    ? "bg-brand/14 text-brand"
                                    : "text-text-muted hover:text-text-primary",
                            )}
                        >
                            <List size={15}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Contenido ──────────────────────────────────────────── */}
            {filteredLists.length === 0 ? (
                <div className="px-5">
                    <EmptyState onCreate={() => setCreateOpen(true)}/>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredLists.map((list) => (
                        <motion.div key={list.id} whileTap={{scale: 0.98}} className="h-full">
                            <Link
                                href={routes.listDetail(list.id)}
                                className="block h-full rounded-3xl transition hover:shadow-md active:scale-[0.98]"
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
                </div>
            ) : (
                /* ── Vista lista / tabla ─────────────────────────────── */
                <div className="mx-5 overflow-hidden rounded-2xl border border-divider bg-white">
                    {/* Cabeceras */}
                    <div className="flex items-center gap-3 border-b border-divider bg-bg-hover px-4 py-2.5">
                        <span className="flex-1 text-[11px] font-extrabold uppercase tracking-[0.07em] text-text-muted">
                            Lista
                        </span>
                        <span
                            className="w-24 shrink-0 text-[11px] font-extrabold uppercase tracking-[0.07em] text-text-muted">
                            Estado
                        </span>
                        <span
                            className="w-20 shrink-0 text-right text-[11px] font-extrabold uppercase tracking-[0.07em] text-text-muted">
                            Total
                        </span>
                        <span
                            className="w-20 shrink-0 text-right text-[11px] font-extrabold uppercase tracking-[0.07em] text-text-muted">
                            Ahorro
                        </span>
                        <span
                            className="w-28 shrink-0 text-right text-[11px] font-extrabold uppercase tracking-[0.07em] text-text-muted">
                            Actualizada
                        </span>
                    </div>

                    {filteredLists.map((list) => (
                        <Link
                            key={list.id}
                            href={routes.listDetail(list.id)}
                            className="block transition hover:bg-bg-hover active:bg-divider"
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
                                    <label
                                        className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
                                        Nombre de la lista
                                    </label>
                                    <div
                                        className="flex items-center gap-3 rounded-2xl border-[1.5px] border-divider bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/10">
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
                                    <Button type="button" variant="secondary" fullWidth size="lg"
                                            className="rounded-2xl" onClick={closeCreateSheet}>
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

function EmptyState({onCreate}: { onCreate: () => void }) {
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
