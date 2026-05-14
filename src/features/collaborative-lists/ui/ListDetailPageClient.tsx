"use client";

import {useCallback, useEffect, useMemo, useRef, useState, useTransition} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft, Plus, Share2, Trash2} from "lucide-react";
import {motion} from "motion/react";
import {Button, Checkbox, Input, ProgressBar} from "@/shared/ui";
import {cn} from "@/shared/lib";
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
import type {CollaboratorRole} from "../model/ports/ListRepository";

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

const titleStorageKey = (listId: string) => `preyo:last-list-title:${listId}`;

function getStoredListTitle(listId: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(titleStorageKey(listId));
}

function canEdit(status: keyof typeof statusLabels, role: CollaboratorRole | null) {
    if (!role || role === "VIEWER") return false;
    return status === "draft" || status === "active";
}

function canToggle(status: keyof typeof statusLabels, role: CollaboratorRole | null) {
    if (!role || role === "VIEWER") return false;
    return status === "draft" || status === "active" || status === "shopping";
}

export function ListDetailPageClient({listId}: ListDetailPageClientProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const repository = useMemo(() => new SupabaseListRepository(supabase), [supabase]);
    const {list, currentUserRole, isLoading, error} = useCollaborativeList({
        supabase,
        listId: listId as Uuid,
    });
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [bottomToast, setBottomToast] = useState<{message: string; kind: "error" | "success"} | null>(null);
    const toastTimerRef = useRef<number | null>(null);
    const [storedListTitle] = useState(() => getStoredListTitle(listId));
    const [isPending, startTransition] = useTransition();
    const lastListTitle = list?.title ?? storedListTitle ?? "esta lista";

    const showBottomToast = useCallback((message: string, kind: "error" | "success" = "error") => {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        setBottomToast({message, kind});
        toastTimerRef.current = window.setTimeout(() => setBottomToast(null), 2800);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!list?.title) return;
        window.localStorage.setItem(titleStorageKey(listId), list.title);
    }, [list?.title, listId]);

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
                <p className="mt-4 rounded-3xl border border-feedback-error-border bg-feedback-error-bg p-5 text-sm font-medium text-error">
                    {`Ya no tienes permisos para acceder a la lista "${lastListTitle}".`}
                </p>
            </div>
        );
    }

    const listCanEdit = canEdit(list.status, currentUserRole);
    const listCanToggle = canToggle(list.status, currentUserRole);
    const isViewer = currentUserRole === "VIEWER";

    const runCommand = (action: () => Promise<void>) => {
        setFormError(null);
        startTransition(async () => {
            try {
                await action();
            } catch (commandError) {
                const message = commandError instanceof Error ? commandError.message : "No se pudo completar la acción.";
                setFormError(message);
                showBottomToast(message, "error");
            }
        });
    };

    const handleAddItem = () => {
        if (isViewer) {
            showBottomToast("No tienes permisos para hacer esto.", "error");
            return;
        }

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
                throw new Error(mapCommandError(result.error, lastListTitle));
            }

            setName("");
            setQuantity("");
        });
    };

    const handleToggle = (item: CollaborativeListItemReadModel) => {
        if (isViewer) {
            showBottomToast("No tienes permisos para hacer esto.", "error");
            return;
        }

        if (!listCanToggle) return;

        runCommand(async () => {
            const result = await new ToggleItemCommandHandler(repository).execute({
                listId: list.id,
                itemId: item.id,
                checked: !item.checked,
                commandId: crypto.randomUUID() as Uuid,
            });

            if (!result.ok) {
                throw new Error(mapCommandError(result.error, lastListTitle));
            }
        });
    };

    const handleDelete = (item: CollaborativeListItemReadModel) => {
        if (isViewer) {
            showBottomToast("No tienes permisos para hacer esto.", "error");
            return;
        }

        if (!listCanEdit) return;

        runCommand(async () => {
            const result = await new RemoveItemCommandHandler(repository).execute({
                listId: list.id,
                itemId: item.id,
                commandId: crypto.randomUUID() as Uuid,
            });

            if (!result.ok) {
                throw new Error(mapCommandError(result.error, lastListTitle));
            }
        });
    };

    return (
        <div className="min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">
            {/* Bottom toast */}
            {bottomToast ? (
                <div className="pointer-events-none fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-center">
                    <div
                        role={bottomToast.kind === "error" ? "alert" : undefined}
                        aria-live={bottomToast.kind !== "error" ? "polite" : undefined}
                        className={cn(
                            "rounded-full px-4 py-3 text-center text-sm font-semibold shadow-[0_12px_32px_rgba(24,24,27,0.18)]",
                            bottomToast.kind === "error" ? "bg-[#FFF0F0] text-error" : "bg-text-primary text-white",
                        )}
                    >
                        {bottomToast.message}
                    </div>
                </div>
            ) : null}

            <header
                className="glass-medium sticky top-0 z-30 border-b border-white/40 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-4">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push(routes.lists)}
                        className="grid size-9 place-items-center rounded-xl bg-feedback-success-bg text-brand-active"
                        aria-label="Volver a listas"
                    >
                        <ArrowLeft size={17}/>
                    </button>
                    <Link
                        href={routes.shareList(list.id)}
                        className="grid size-9 place-items-center rounded-xl bg-feedback-success-bg text-brand-active"
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
                    <span className="rounded-full bg-feedback-success-bg px-3 py-1 text-xs font-bold text-brand-active">
                        {stats.pct}%
                    </span>
                </div>

                <ProgressBar value={stats.checked} max={Math.max(stats.total, 1)}/>

                {isViewer ? (
                    <div
                        className="mt-3 rounded-2xl border border-divider bg-bg-soft px-3 py-2 text-xs font-semibold text-text-muted">
                        Tienes acceso de solo lectura a esta lista.
                    </div>
                ) : !listCanEdit ? (
                    <div
                        className="mt-3 rounded-2xl border border-feedback-error-border bg-feedback-error-bg px-3 py-2 text-xs font-semibold text-error">
                        Lista en modo lectura. La edición de productos está desactivada.
                    </div>
                ) : null}
            </header>

            <main className="px-5 pt-4">
                {!isViewer ? (
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
                            <p className="mt-3 rounded-2xl border border-feedback-error-border bg-feedback-error-bg px-3 py-2 text-xs font-semibold text-error">
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
                ) : null}

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
                                className="grid size-9 place-items-center rounded-xl bg-feedback-error-bg text-error disabled:cursor-not-allowed disabled:opacity-40"
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

function mapCommandError(error: { kind: string }, listName: string) {
    switch (error.kind) {
        case "UNAUTHORIZED":
            return "Debes iniciar sesión.";
        case "FORBIDDEN":
            return "No tienes permisos para hacer esto.";
        case "LIST_NOT_FOUND":
            return `Ya no tienes permisos para modificar la lista "${listName}".`;
        case "NOT_FOUND":
            return "No se ha encontrado el recurso.";
        case "LIST_LOCKED":
            return "La lista está bloqueada.";
        case "DUPLICATE_PRODUCT":
            return "Este producto ya está en la lista.";
        case "ITEM_NOT_FOUND":
            return "No se encontró el producto.";
        case "CAPACITY_EXCEEDED":
            return "Se ha superado el límite de peso de la lista.";
        default:
            return "No se pudo completar la acción.";
    }
}
