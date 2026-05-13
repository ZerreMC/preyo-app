"use client";

import {useMemo, useState, useTransition} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Check, Plus, Search, X} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ListCard} from "@/entities/shopping-list";
import {routes} from "@/shared/config/routes";
import {Button, Input} from "@/shared/ui";
import {createClient} from "@/shared/api/supabase/browserClient";
import {
    CreateListCommandHandler,
    SupabaseListRepository,
    type ShoppingListSummary,
    type Uuid,
} from "@/features/collaborative-lists";

type ListsPageClientProps = {
    lists: ShoppingListSummary[];
};

const statusLabels: Record<ShoppingListSummary["status"], string> = {
    draft: "Borrador",
    active: "Activa",
    shopping: "En compra",
    completed: "Completada",
    archived: "Archivada",
};

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

export function ListsPageClient({lists}: ListsPageClientProps) {
    const router = useRouter();
    const [items, setItems] = useState(lists);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [categoryId, setCategoryId] = useState<(typeof listCategories)[number]["id"]>("semanal");
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const filteredLists = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return items;

        return items.filter((list) => list.title.toLowerCase().includes(query));
    }, [items, searchQuery]);

    const selectedCategory = listCategories.find((category) => category.id === categoryId) ?? listCategories[0];

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
                    setFormError("No se pudo crear la lista.");
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
        <div className="min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-3">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h1 className="min-w-0 text-[26px] font-extrabold tracking-normal text-text-primary">
                        Mis listas
                    </h1>
                    <Button
                        size="sm"
                        leftIcon={<Plus size={15}/>}
                        className="h-10 min-w-fit shrink-0 flex-row flex-nowrap whitespace-nowrap rounded-2xl px-4 text-[13px]"
                        onClick={() => setCreateOpen(true)}
                    >
                        Nueva
                    </Button>
                </div>

                <Input
                    leftIcon={Search}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Buscar en mis listas..."
                    aria-label="Buscar en mis listas"
                />
            </div>

            <div className="mb-4 flex items-center justify-between px-5">
                <p className="text-[13px] text-text-muted">
                    {filteredLists.length} lista{filteredLists.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[13px] font-medium text-text-muted">Más recientes</p>
            </div>

            <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredLists.length > 0 ? (
                    filteredLists.map((list) => (
                        <motion.div key={list.id} whileTap={{scale: 0.98}} className="h-full">
                            <Link
                                href={routes.listDetail(list.id)}
                                className="block h-full rounded-3xl transition active:scale-[0.98] hover:shadow-md"
                                aria-label={`Abrir ${list.title}`}
                            >
                                <ListCard
                                    list={{
                                        id: list.id,
                                        title: list.title,
                                        categoryEmoji: statusEmoji[list.status],
                                        itemCount: list.itemCount,
                                        totalPrice: 0,
                                        progressPct: list.itemCount > 0 ? Math.round((list.checkedCount / list.itemCount) * 100) : 0,
                                        collaborators: list.collaborators,
                                        isLocked: isReadOnlyStatus(list.status),
                                    }}
                                    className="h-full shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                                />
                                <span className="mt-2 block px-1 text-[11px] font-semibold text-text-muted">
                                    {statusLabels[list.status]} · {list.collaborators.length} colaborador{list.collaborators.length !== 1 ? "es" : ""}
                                </span>
                            </Link>
                        </motion.div>
                    ))
                ) : (
                    <div className="md:col-span-2 lg:col-span-3">
                        <EmptyState onCreate={() => setCreateOpen(true)}/>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isCreateOpen ? (
                    <motion.div
                        className="fixed inset-0 z-80 flex flex-col justify-end bg-text-primary/45 backdrop-blur-[8px]"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        onClick={(event) => {
                            if (event.target === event.currentTarget) {
                                closeCreateSheet();
                            }
                        }}
                    >
                        <motion.form
                            initial={{y: "100%", opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            exit={{y: "100%", opacity: 0}}
                            transition={{type: "spring", stiffness: 280, damping: 32}}
                            className="max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-bg-main shadow-[0_-8px_48px_rgba(0,0,0,0.18)]"
                            onClick={(event) => event.stopPropagation()}
                            onSubmit={(event) => {
                                event.preventDefault();
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
                                            onChange={(event) => setNewTitle(event.target.value)}
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
                                                    <span
                                                        className={active ? "text-center text-[10px] font-bold leading-tight text-brand-active" : "text-center text-[10px] font-medium leading-tight text-text-muted"}>
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
