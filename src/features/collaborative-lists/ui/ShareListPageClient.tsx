"use client";

import {useEffect, useMemo, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft, Check, Copy, Mail, X} from "lucide-react";
import {Button, Input, Avatar} from "@/shared/ui";
import {routes} from "@/shared/config/routes";
import {createClient} from "@/shared/api/supabase/browserClient";
import {
    AddCollaboratorCommandHandler,
    GenerateInviteTokenCommandHandler,
    RemoveCollaboratorCommandHandler,
    SupabaseListRepository,
    getCollaborators,
    type CollaboratorRole,
    type ListCollaborator,
    type Uuid,
} from "@/features/collaborative-lists";
import {useCollaborativeList} from "../model/hooks/useCollaborativeList";

type ShareListPageClientProps = {
    listId: string;
};

const roles: { id: Exclude<CollaboratorRole, "OWNER">; label: string; description: string }[] = [
    {id: "EDITOR", label: "Editor", description: "Puede añadir y marcar productos"},
    {id: "VIEWER", label: "Solo lectura", description: "Solo puede ver la lista"},
];

export function ShareListPageClient({listId}: ShareListPageClientProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const repository = useMemo(() => new SupabaseListRepository(supabase), [supabase]);
    const {list} = useCollaborativeList({supabase, listId: listId as Uuid});
    const [collaborators, setCollaborators] = useState<ListCollaborator[]>([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Exclude<CollaboratorRole, "OWNER">>("EDITOR");
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let cancelled = false;

        getCollaborators(repository, listId as Uuid)
            .then((data) => {
                if (!cancelled) setCollaborators(data);
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los colaboradores.");
            });

        return () => {
            cancelled = true;
        };
    }, [listId, repository]);

    const refreshCollaborators = async () => {
        setCollaborators(await getCollaborators(repository, listId as Uuid));
    };

    const runAction = (action: () => Promise<void>) => {
        setError(null);
        setMessage(null);
        startTransition(async () => {
            try {
                await action();
            } catch (actionError) {
                setError(actionError instanceof Error ? actionError.message : "No se pudo completar la acción.");
            }
        });
    };

    const handleInvite = () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail.includes("@")) {
            setError("Introduce un email válido.");
            return;
        }

        runAction(async () => {
            const result = await new AddCollaboratorCommandHandler(repository).execute({
                listId: listId as Uuid,
                email: normalizedEmail,
                role,
            });

            if (!result.ok) {
                throw new Error("No se pudo añadir el colaborador.");
            }

            setEmail("");
            setMessage(`Colaborador añadido: ${normalizedEmail}`);
            await refreshCollaborators();
        });
    };

    const handleGenerateLink = () => {
        runAction(async () => {
            const result = await new GenerateInviteTokenCommandHandler(repository).execute({
                listId: listId as Uuid,
            });

            if (!result.ok) {
                throw new Error("No se pudo generar el enlace.");
            }

            const link = `${window.location.origin}/lists/invite/${result.value}`;
            setInviteLink(link);
            await navigator.clipboard?.writeText(link);
            setMessage("Enlace copiado al portapapeles.");
        });
    };

    const handleRemove = (collaborator: ListCollaborator) => {
        runAction(async () => {
            const result = await new RemoveCollaboratorCommandHandler(repository).execute({
                listId: listId as Uuid,
                userId: collaborator.id,
            });

            if (!result.ok) {
                throw new Error("No se pudo quitar el colaborador.");
            }

            await refreshCollaborators();
        });
    };

    return (
        <div className="min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">
            <header
                className="sticky top-0 z-30 border-b border-white/50 bg-bg-main/95 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-4 shadow-[0_6px_18px_rgba(31,42,36,0.06)]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push(routes.listDetail(listId))}
                        className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand-active"
                        aria-label="Volver al detalle"
                    >
                        <ArrowLeft size={18}/>
                    </button>
                    <div>
                        <h1 className="text-[19px] font-extrabold tracking-normal text-text-primary">Compartir
                            lista</h1>
                        <p className="text-[12px] text-text-muted">{list?.title ?? "Lista"}</p>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-5">
                <section
                    className="mb-5 rounded-3xl border border-divider bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
                    <h2 className="mb-3 text-[13px] font-bold text-text-primary">Invitar por correo electrónico</h2>
                    <Input
                        type="email"
                        leftIcon={Mail}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="correo@ejemplo.com"
                    />

                    <div className="mt-3 grid gap-2">
                        {roles.map((option) => {
                            const active = role === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setRole(option.id)}
                                    className={[
                                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                                        active ? "border-brand bg-brand/12" : "border-divider bg-bg-main",
                                    ].join(" ")}
                                >
                                    <span>
                                        <span
                                            className="block text-[13px] font-bold text-text-primary">{option.label}</span>
                                        <span className="block text-[11px] text-text-muted">{option.description}</span>
                                    </span>
                                    {active ? <Check size={15} className="text-brand-active"/> : null}
                                </button>
                            );
                        })}
                    </div>

                    <Button fullWidth className="mt-4 rounded-2xl" disabled={!email.includes("@")} loading={isPending}
                            onClick={handleInvite}>
                        Añadir colaborador
                    </Button>
                </section>

                <button
                    type="button"
                    onClick={handleGenerateLink}
                    className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-divider bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bg-soft text-text-muted">
                        <Copy size={16}/>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span
                            className="block text-[13px] font-semibold text-text-primary">Copiar enlace de invitación</span>
                        <span
                            className="block truncate text-[11px] text-text-muted">{inviteLink ?? "Genera un enlace de un solo uso"}</span>
                    </span>
                </button>

                {error ? (
                    <p className="mb-4 rounded-2xl border border-feedback-error-border bg-feedback-error-bg px-4 py-3 text-sm font-medium text-error">
                        {error}
                    </p>
                ) : null}

                {message ? (
                    <p className="mb-4 rounded-2xl border border-feedback-success-border bg-feedback-success-bg px-4 py-3 text-sm font-medium text-brand-active">
                        {message}
                    </p>
                ) : null}

                <section className="mb-5">
                    <h2 className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
                        Colaboradores actuales
                    </h2>
                    <div
                        className="divide-y divide-divider overflow-hidden rounded-3xl border border-divider bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        {collaborators.length > 0 ? (
                            collaborators.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                                    <Avatar initials={member.initials} color={member.color}/>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-semibold text-text-primary">{member.name}</p>
                                        <p className="text-[11px] text-text-muted">{member.role === "OWNER" ? "Propietario" : member.role === "EDITOR" ? "Editor" : "Solo lectura"}</p>
                                    </div>
                                    {member.role !== "OWNER" ? (
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(member)}
                                            className="grid size-8 place-items-center rounded-full bg-feedback-error-bg text-error"
                                            aria-label={`Quitar ${member.name}`}
                                        >
                                            <X size={13}/>
                                        </button>
                                    ) : null}
                                </div>
                            ))
                        ) : (
                            <p className="px-4 py-3.5 text-sm text-text-muted">No hay colaboradores visibles.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
