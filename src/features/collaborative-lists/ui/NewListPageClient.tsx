"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {Check, X} from "lucide-react";
import {Button, Input} from "@/shared/ui";
import {routes} from "@/shared/config/routes";
import {createClient} from "@/shared/api/supabase/browserClient";
import {
    CreateListCommandHandler,
    SupabaseListRepository,
    type Uuid,
} from "@/features/collaborative-lists";

export function NewListPageClient() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        const normalizedTitle = title.trim();
        if (!normalizedTitle) {
            setError("El nombre de la lista es obligatorio.");
            return;
        }

        setError(null);
        startTransition(async () => {
            try {
                const supabase = createClient();
                const repository = new SupabaseListRepository(supabase);
                const result = await new CreateListCommandHandler(repository).execute({
                    title: normalizedTitle,
                    listId: crypto.randomUUID() as Uuid,
                    commandId: crypto.randomUUID() as Uuid,
                });

                if (!result.ok) {
                    console.error('[CreateList] error:', result.error);
                    setError(
                        result.error.kind === 'UNAUTHORIZED'
                            ? 'Sesión expirada. Recarga la página.'
                            : result.error.kind === 'INVALID_INPUT' && result.error.message
                                ? result.error.message
                                : 'No se pudo crear la lista.'
                    );
                    return;
                }

                router.push(routes.listDetail(result.value.id));
            } catch (createError) {
                setError(createError instanceof Error ? createError.message : "No se pudo crear la lista.");
            }
        });
    };

    return (
        <div
            className="min-h-dvh px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
            <div
                className="mx-auto max-w-xl rounded-3xl border border-divider bg-surface p-5 shadow-[0_8px_32px_rgba(31,42,36,0.10)]">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-[22px] font-black tracking-normal text-text-primary">Nueva lista</h1>
                        <p className="text-[13px] text-text-muted">Organiza tu próxima compra</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push(routes.lists)}
                        className="grid size-9 place-items-center rounded-xl bg-[rgba(57,184,107,0.12)] text-text-muted"
                        aria-label="Cancelar"
                    >
                        <X size={17}/>
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSave();
                    }}
                >
                    <Input
                        autoFocus
                        label="Nombre de la lista"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ej: Compra semanal"
                        errorMessage={error ?? undefined}
                    />

                    <div className="mt-6 flex gap-3">
                        <Button variant="secondary" fullWidth className="rounded-2xl"
                                onClick={() => router.push(routes.lists)}>
                            Cancelar
                        </Button>
                        <Button type="submit" fullWidth className="rounded-2xl" disabled={!title.trim()}
                                loading={isPending}>
                            {!isPending ? <Check size={17}/> : null}
                            Guardar lista
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
