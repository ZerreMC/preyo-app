"use client";

import {useMemo, useState, useTransition} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft, Plus, Share2, Trash2} from "lucide-react";
import {motion} from "motion/react";
import {Button, Checkbox, Input, ProgressBar} from "@/shared/ui";
import {routes} from "@/shared/config/routes";
import {createClient} from "@/shared/api/supabase/browserClient";
import {
    AddItemCommandHandler,
    RemoveItemCommandHandler,
    SupabaseListRepository,
    ToggleItemCommandHandler,
    type CollaborativeListItemReadModel,
    type Uuid,
} from "@/features/collaborative-lists";
import {useCollaborativeList} from "../model/hooks/useCollaborativeList";

type ListDetailPageClientProps = {
    listId: string;
};

const statusLabels = {
    draft: "Borrador",
    active: "Activa",
    shopping: "En compra",
    completed: "Completada",
    archived: "Archivada",
} as const;

function canEdit(status: keyof typeof statusLabels) {
    return status === "draft" || status === "active";
}

function canToggle(status: keyof typeof statusLabels) {
    return status === "draft" || status === "active" || status === "shopping";
}

export function ListDetailPageClient({listId}: ListDetailPageClientProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const repository = useMemo(() => new SupabaseListRepository(supabase), [supabase]);
    const {list, isLoading, error} = useCollaborativeList({
        supabase,
        listId: listId as Uuid,
    });
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const stats = useMemo(() => {
        const items = list?.items ?? [];
        const checked = items.filter((item) => item.checked).length;

        return {
            checked,
            total: items.length,
            pct: items.length > 0 ? Math.round((checked / items.length) * 100) : 0,
        };
    }, [list]);

    const pendingItems = useMemo(() => (list?.items ?? []).filter((item) => !item.checked), [list]);
    const checkedItems = useMemo(() => (list?.items ?? []).filter((item) => item.checked), [list]);

    if (isLoading) {
        return (
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))]">
                <p className="rounded-3xl border border-divider bg-white p-5 text-sm text-text-muted">
                    Cargando lista...
                </p>
            </div>
        );
    }

    if (error || !list) {
        return (
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))]">
                <Button variant="secondary" onClick={() => router.push(routes.lists)}>
                    Volver a listas
                </Button>
                <p className="mt-4 rounded-3xl border border-[#FFD6D6] bg-[#FFF0F0] p-5 text-sm font-medium text-error">
                    {error ?? "No se encontró la lista."}
                </p>
            </div>
        );
    }

    const listCanEdit = canEdit(list.status);
    const listCanToggle = canToggle(list.status);

    const runCommand = (action: () => Promise<void>) => {
        setFormError(null);
        startTransition(async () => {
            try {
                await action();
            } catch (commandError) {
                setFormError(commandError instanceof Error ? commandError.message : "No se pudo completar la acción.");
            }
        });
    };

    const handleAddItem = () => {
        const trimmedName = name.trim();
        const trimmedQuantity = quantity.trim();
        if (!trimmedName) {
            setFormError("El nombre del producto es obligatorio.");
            return;
        }

        runCommand(async () => {
            const result = await new AddItemCommandHandler(repository).execute({
                listId: list.id,
                itemId: crypto.randomUUID() as Uuid,
                commandId: crypto.randomUUID() as Uuid,
                productRef: trimmedName.toLowerCase(),
                name: trimmedName,
                quantity: trimmedQuantity || null,
                estimatedWeightG: 0,
            });

            if (!result.ok) {
                throw new Error(mapCommandError(result.error));
            }

            setName("");
            setQuantity("");
        });
    };

    const handleToggle = (item: CollaborativeListItemReadModel) => {
        if (!listCanToggle) return;

        runCommand(async () => {
            const result = await new ToggleItemCommandHandler(repository).execute({
                listId: list.id,
                itemId: item.id,
                checked: !item.checked,
                commandId: crypto.randomUUID() as Uuid,
            });

            if (!result.ok) {
                throw new Error(mapCommandError(result.error));
            }
        });
    };

    const handleDelete = (item: CollaborativeListItemReadModel) => {
        if (!listCanEdit) return;

        runCommand(async () => {
            const result = await new RemoveItemCommandHandler(repository).execute({
                listId: list.id,
                itemId: item.id,
                commandId: crypto.randomUUID() as Uuid,
            });

            if (!result.ok) {
                throw new Error(mapCommandError(result.error));
            }
        });
    };

    return (
        <div className="min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">
            <header
                className="glass-medium sticky top-0 z-30 border-b border-white/40 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-4">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push(routes.lists)}
                        className="grid size-9 place-items-center rounded-xl bg-[#ECF8EE] text-brand-active"
                        aria-label="Volver a listas"
                    >
                        <ArrowLeft size={17}/>
                    </button>
                    <Link
                        href={routes.shareList(list.id)}
                        className="grid size-9 place-items-center rounded-xl bg-[#ECF8EE] text-brand-active"
                        aria-label="Compartir lista"
                    >
                        <Share2 size={15}/>
                    </Link>
                </div>

                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="truncate text-[22px] font-extrabold tracking-normal text-text-primary">
                            {list.title}
                        </h1>
                        <p className="mt-1 text-[12px] font-semibold text-text-muted">
                            {statusLabels[list.status]} · {stats.checked} de {stats.total} productos
                        </p>
                    </div>
                    <span className="rounded-full bg-[#ECF8EE] px-3 py-1 text-[12px] font-bold text-brand-active">
                        {stats.pct}%
                    </span>
                </div>

                <ProgressBar value={stats.checked} max={Math.max(stats.total, 1)}/>

                {!listCanEdit ? (
                    <div
                        className="mt-3 rounded-2xl border border-[#FFD6D6] bg-[#FFF0F0] px-3 py-2 text-[12px] font-semibold text-error">
                        Lista en modo lectura. La edición de productos está desactivada.
                    </div>
                ) : null}
            </header>

            <main className="px-5 pt-4">
                <form
                    className="mb-5 rounded-3xl border border-divider bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleAddItem();
                    }}
                >
                    <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                        <Input
                            label="Producto"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ej: Leche"
                            disabled={!listCanEdit || isPending}
                        />
                        <Input
                            label="Cantidad"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            placeholder="Opcional"
                            disabled={!listCanEdit || isPending}
                        />
                    </div>
                    {formError ? (
                        <p className="mt-3 rounded-2xl border border-[#FFD6D6] bg-[#FFF0F0] px-3 py-2 text-[12px] font-semibold text-error">
                            {formError}
                        </p>
                    ) : null}
                    <Button
                        type="submit"
                        fullWidth
                        className="mt-4 rounded-2xl"
                        leftIcon={<Plus size={16}/>}
                        loading={isPending}
                        disabled={!listCanEdit || !name.trim()}
                    >
                        Añadir producto
                    </Button>
                </form>

                <ItemSection
                    title="Pendientes"
                    items={pendingItems}
                    canToggle={listCanToggle}
                    canDelete={listCanEdit}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                />

                <ItemSection
                    title="Comprados"
                    items={checkedItems}
                    canToggle={listCanToggle}
                    canDelete={listCanEdit}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                />
            </main>
        </div>
    );
}

function ItemSection({
                         title,
                         items,
                         canToggle,
                         canDelete,
                         onToggle,
                         onDelete,
                     }: {
    title: string;
    items: CollaborativeListItemReadModel[];
    canToggle: boolean;
    canDelete: boolean;
    onToggle: (item: CollaborativeListItemReadModel) => void;
    onDelete: (item: CollaborativeListItemReadModel) => void;
}) {
    return (
        <section className="mb-5">
            <div className="mb-2 flex items-center gap-2">
                <h2 className="text-[13px] font-bold text-text-muted">{title}</h2>
                <div className="h-px flex-1 bg-divider"/>
                <span className="text-[11px] text-text-muted">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
                {items.length > 0 ? (
                    items.map((item) => (
                        <motion.article
                            key={item.id}
                            layout
                            className="flex items-center gap-3 rounded-2xl border border-divider bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                        >
                            <Checkbox
                                checked={item.checked}
                                disabled={!canToggle}
                                onChange={() => onToggle(item)}
                                aria-label={`Marcar ${item.name}`}
                            />
                            <div className="min-w-0 flex-1">
                                <p className={item.checked ? "truncate text-[14px] font-semibold text-text-muted line-through" : "truncate text-[14px] font-semibold text-text-primary"}>
                                    {item.name}
                                </p>
                                {item.quantity ? (
                                    <p className="text-[12px] text-text-muted">{item.quantity}</p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                disabled={!canDelete}
                                onClick={() => onDelete(item)}
                                className="grid size-9 place-items-center rounded-xl bg-[#FFF0F0] text-error disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Eliminar ${item.name}`}
                            >
                                <Trash2 size={15}/>
                            </button>
                        </motion.article>
                    ))
                ) : (
                    <p className="rounded-2xl border border-divider bg-white px-4 py-3 text-sm text-text-muted">
                        No hay productos en esta sección.
                    </p>
                )}
            </div>
        </section>
    );
}

function mapCommandError(error: { kind: string }) {
    switch (error.kind) {
        case "LIST_LOCKED":
            return "La lista está en modo lectura.";
        case "DUPLICATE_PRODUCT":
            return "Ese producto ya existe en la lista.";
        case "ITEM_NOT_FOUND":
            return "No se encontró el producto.";
        case "FORBIDDEN":
            return "No tienes permisos para editar esta lista.";
        case "UNAUTHORIZED":
            return "Inicia sesión para continuar.";
        default:
            return "No se pudo completar la acción.";
    }
}
