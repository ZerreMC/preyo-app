"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft, Check, Copy, Link2, Mail, ShieldCheck, UserRound} from "lucide-react";
import {Avatar, Button, Input, Toggle} from "@/shared/ui";
import {routes} from "@/shared/config/routes";
import {createClient} from "@/shared/api/supabase/browserClient";
import {
    AddCollaboratorCommandHandler,
    GenerateInviteTokenCommandHandler,
    RemoveCollaboratorCommandHandler,
    RevokeInviteCommandHandler,
    SupabaseListRepository,
    UpdateCollaboratorInvitePermissionCommandHandler,
    getCollaborators,
    type CollaboratorRole,
    type ListCollaborator,
    type PendingListInvite,
    type Uuid,
} from "@/features/collaborative-lists";
import {useCollaborativeList} from "../model/hooks/useCollaborativeList";

type ShareListPageClientProps = {
    listId: string;
};

type ShareRole = Exclude<CollaboratorRole, "OWNER">;
type ToastTone = "success" | "error" | "info";
type InviteButtonState = "idle" | "loading" | "success";

type ToastState = {
    tone: ToastTone;
    message: string;
} | null;

type FeedbackKind =
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "LIST_NOT_FOUND"
    | "LIMIT_REACHED"
    | "ALREADY_MEMBER"
    | "INVITE_PENDING"
    | "INVALID_EMAIL"
    | "OWNER_PROTECTED"
    | "INVITE_EXPIRED"
    | "INVITE_USED"
    | "INVITE_REVOKED"
    | "USER_NOT_FOUND"
    | "INVALID_INPUT";

const roleOptions: { id: ShareRole; label: string }[] = [
    {id: "EDITOR", label: "Editor"},
    {id: "VIEWER", label: "Solo lectura"},
];

const roleLabels: Record<CollaboratorRole, string> = {
    OWNER: "Propietario",
    EDITOR: "Editor",
    VIEWER: "Solo lectura",
};

const roleBadges: Record<CollaboratorRole, string> = {
    OWNER: "OWNER",
    EDITOR: "EDITOR",
    VIEWER: "VIEWER",
};

const COOLDOWN_MS = 2600;
const TOAST_MS = 2800;

const titleStorageKey = (listId: string) => `preyo:last-list-title:${listId}`;

function getStoredListTitle(listId: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(titleStorageKey(listId));
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function mapFeedback(kind: FeedbackKind, listName: string) {
    switch (kind) {
        case "UNAUTHORIZED":
            return "Sesión expirada. Vuelve a iniciar sesión.";
        case "FORBIDDEN":
            return "No tienes permisos para realizar esta acción.";
        case "LIST_NOT_FOUND":
            return `Ya no tienes permisos para acceder a la lista "${listName}".`;
        case "LIMIT_REACHED":
            return "Se alcanzó el límite de colaboradores.";
        case "ALREADY_MEMBER":
            return "Este usuario ya está en la lista.";
        case "INVITE_PENDING":
            return "Ya existe una invitación pendiente.";
        case "INVALID_EMAIL":
            return "Introduce un email válido.";
        case "OWNER_PROTECTED":
            return "No puedes quitar al propietario.";
        case "INVITE_EXPIRED":
            return "Este enlace ha caducado.";
        case "INVITE_USED":
            return "Este enlace ya fue usado.";
        case "INVITE_REVOKED":
            return "Esta invitación fue cancelada.";
        default:
            return "No se pudo completar la acción.";
    }
}

function mapCommandError(error: { kind: string }, listName: string) {
    if (error.kind === "FORBIDDEN" || error.kind === "LIST_NOT_FOUND") {
        return "Ya no tienes permisos para modificar esta lista.";
    }

    return mapFeedback(error.kind as FeedbackKind, listName);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("es", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function inviteLink(token: string) {
    return `${window.location.origin}/lists/invite/${token}`;
}

function displayLink(link: string) {
    try {
        const url = new URL(link);
        return `${url.host}${url.pathname}`;
    } catch {
        return link;
    }
}

export function ShareListPageClient({listId}: ShareListPageClientProps) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const repository = useMemo(() => new SupabaseListRepository(supabase), [supabase]);
    const {list, isLoading: isListLoading, error: listLoadError} = useCollaborativeList({
        supabase,
        listId: listId as Uuid,
    });

    const [userId, setUserId] = useState<string | null>(null);
    const [currentEmail, setCurrentEmail] = useState<string | null>(null);
    const [collaborators, setCollaborators] = useState<ListCollaborator[]>([]);
    const [pendingInvites, setPendingInvites] = useState<PendingListInvite[]>([]);
    const [isSharingLoading, setIsSharingLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [emailRole, setEmailRole] = useState<ShareRole>("EDITOR");
    const [emailCanInvite, setEmailCanInvite] = useState(false);
    const [linkRole, setLinkRole] = useState<ShareRole>("EDITOR");
    const [linkCanInvite, setLinkCanInvite] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [listTitleFallback, setListTitleFallback] = useState("Cargando nombre de la lista...");
    const [toast, setToast] = useState<ToastState>(null);
    const [inviteButtonState, setInviteButtonState] = useState<InviteButtonState>("idle");
    const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [isCoolingDown, setIsCoolingDown] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const actionLockedRef = useRef(false);
    const cooldownUntilRef = useRef(0);
    const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const trimmedEmail = email.trim().toLowerCase();
    const listName = list?.title ?? listTitleFallback;
    const currentMember = collaborators.find((member) => member.id === userId);
    const isOwner = currentMember?.role === "OWNER";
    const canInvite = Boolean(currentMember && (currentMember.role === "OWNER" || currentMember.canInvite));
    const isSelfInvite = Boolean(currentEmail && trimmedEmail === currentEmail.toLowerCase());
    const isEmailInvalid = email.length > 0 && !isValidEmail(email);
    const emailError = isEmailInvalid
        ? "Introduce un email válido."
        : isSelfInvite
            ? "No puedes invitarte a ti mismo."
            : null;
    const allowedRoles = useMemo<ShareRole[]>(() => {
        if (!currentMember) return [];
        if (currentMember.role === "VIEWER") return currentMember.canInvite ? ["VIEWER"] : [];
        return canInvite ? ["EDITOR", "VIEWER"] : [];
    }, [canInvite, currentMember]);
    const isInviteDisabled =
        !canInvite ||
        !isValidEmail(email) ||
        isSelfInvite ||
        isSubmittingInvite ||
        isCoolingDown;

    const showToast = (tone: ToastTone, message: string) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({tone, message});
        toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS);
    };

    useEffect(() => {
        const storedTitle = getStoredListTitle(listId);
        if (storedTitle) setListTitleFallback(storedTitle);
    }, [listId]);

    useEffect(() => {
        if (!list?.title) return;
        setListTitleFallback(list.title);
        window.localStorage.setItem(titleStorageKey(listId), list.title);
    }, [list?.title, listId]);

    useEffect(() => {
        let cancelled = false;

        supabase.auth.getUser().then(({data}) => {
            if (cancelled) return;
            setUserId(data.user?.id ?? null);
            setCurrentEmail(data.user?.email ?? null);
        });

        return () => {
            cancelled = true;
        };
    }, [supabase]);

    const refreshSharingState = async (showLoading = false) => {
        if (showLoading) setIsSharingLoading(true);
        const [nextCollaborators, nextInvites] = await Promise.all([
            getCollaborators(repository, listId as Uuid),
            repository.getPendingInvites(listId as Uuid),
        ]);
        setCollaborators(nextCollaborators);
        setPendingInvites(nextInvites);
        if (showLoading) setIsSharingLoading(false);
    };

    useEffect(() => {
        let cancelled = false;

        setIsSharingLoading(true);
        Promise.all([
            getCollaborators(repository, listId as Uuid),
            repository.getPendingInvites(listId as Uuid),
        ])
            .then(([nextCollaborators, nextInvites]) => {
                if (cancelled) return;
                setCollaborators(nextCollaborators);
                setPendingInvites(nextInvites);
            })
            .catch(() => {
                if (!cancelled) showToast("error", "No se pudieron cargar los datos para compartir.");
            })
            .finally(() => {
                if (!cancelled) setIsSharingLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [listId, repository]);

    useEffect(() => {
        if (allowedRoles.length === 0) return;
        if (!allowedRoles.includes(emailRole)) setEmailRole(allowedRoles[0]);
        if (!allowedRoles.includes(linkRole)) setLinkRole(allowedRoles[0]);
    }, [allowedRoles, emailRole, linkRole]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    const guardCooldown = () => {
        if (Date.now() < cooldownUntilRef.current || actionLockedRef.current) {
            showToast("info", "Espera unos segundos antes de volver a intentarlo.");
            return false;
        }

        return true;
    };

    const startCooldown = () => {
        cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
        setIsCoolingDown(true);
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
            setIsCoolingDown(false);
            cooldownUntilRef.current = 0;
        }, COOLDOWN_MS);
    };

    const handleInviteByEmail = async () => {
        if (!canInvite) {
            showToast("error", "No tienes permisos para invitar colaboradores.");
            return;
        }

        if (!isValidEmail(email)) {
            showToast("error", "Introduce un email válido.");
            return;
        }

        if (isSelfInvite) {
            showToast("error", "No puedes invitarte a ti mismo.");
            return;
        }

        if (!guardCooldown()) return;

        actionLockedRef.current = true;
        setIsSubmittingInvite(true);
        setInviteButtonState("loading");
        let didSucceed = false;

        try {
            const result = await new AddCollaboratorCommandHandler(repository).execute({
                listId: listId as Uuid,
                email: trimmedEmail,
                role: emailRole,
                canInvite: isOwner && emailCanInvite,
            });

            if (!result.ok) {
                showToast("error", mapCommandError(result.error, listName));
                return;
            }

            const link = inviteLink(result.value);
            setGeneratedLink(link);
            setEmail("");
            setInviteButtonState("success");
            didSucceed = true;
            showToast("success", "Invitación enviada correctamente.");
            startCooldown();
            await copyText(link, false);
            await refreshSharingState();
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => setInviteButtonState("idle"), 1800);
        } catch {
            showToast("error", "Ya no tienes permisos para modificar esta lista.");
        } finally {
            actionLockedRef.current = false;
            setIsSubmittingInvite(false);
            if (!didSucceed) setInviteButtonState("idle");
        }
    };

    const handleGenerateOpenLink = async () => {
        if (!canInvite) {
            showToast("error", "No tienes permisos para invitar colaboradores.");
            return;
        }

        if (!guardCooldown()) return;

        actionLockedRef.current = true;
        setIsGeneratingLink(true);

        try {
            const result = await new GenerateInviteTokenCommandHandler(repository).execute({
                listId: listId as Uuid,
                role: linkRole,
                canInvite: isOwner && linkCanInvite,
            });

            if (!result.ok) {
                showToast("error", mapCommandError(result.error, listName));
                return;
            }

            const link = inviteLink(result.value);
            setGeneratedLink(link);
            startCooldown();
            await copyText(link, true);
            await refreshSharingState();
        } catch {
            showToast("error", "No se pudo generar el enlace.");
        } finally {
            actionLockedRef.current = false;
            setIsGeneratingLink(false);
        }
    };

    const copyText = async (text: string, showSuccessToast: boolean) => {
        try {
            if (!navigator.clipboard) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(text);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 1600);
            if (showSuccessToast) showToast("success", "Enlace copiado.");
        } catch {
            showToast("error", "No se pudo copiar el enlace. Copia la URL manualmente.");
        }
    };

    const handleCopyGeneratedLink = async () => {
        if (!generatedLink) {
            showToast("info", "Genera una invitación para obtener un enlace.");
            return;
        }

        await copyText(generatedLink, true);
    };

    const handleRemove = async (collaborator: ListCollaborator) => {
        actionLockedRef.current = true;

        try {
            const result = await new RemoveCollaboratorCommandHandler(repository).execute({
                listId: listId as Uuid,
                userId: collaborator.id,
            });

            if (!result.ok) {
                showToast("error", mapCommandError(result.error, listName));
                return;
            }

            setConfirmRemoveId(null);
            showToast("success", `${collaborator.name} ya no tiene acceso.`);
            await refreshSharingState();
        } catch {
            showToast("error", "No se pudo revocar el acceso.");
        } finally {
            actionLockedRef.current = false;
        }
    };

    const handleCanInviteChange = async (collaborator: ListCollaborator, nextValue: boolean) => {
        try {
            const result = await new UpdateCollaboratorInvitePermissionCommandHandler(repository).execute({
                listId: listId as Uuid,
                userId: collaborator.id,
                canInvite: nextValue,
            });

            if (!result.ok) {
                showToast("error", mapCommandError(result.error, listName));
                return;
            }

            showToast("success", nextValue ? "Permiso de invitación activado." : "Permiso de invitación desactivado.");
            await refreshSharingState();
        } catch {
            showToast("error", "No se pudo cambiar el permiso.");
        }
    };

    const handleRevokeInvite = async (invite: PendingListInvite) => {
        try {
            const result = await new RevokeInviteCommandHandler(repository).execute({inviteId: invite.id});

            if (!result.ok) {
                showToast("error", mapCommandError(result.error, listName));
                return;
            }

            showToast("success", "Invitación revocada.");
            await refreshSharingState();
        } catch {
            showToast("error", "No se pudo revocar la invitación.");
        }
    };

    if (!isListLoading && (listLoadError || !list)) {
        return (
            <div className="min-h-dvh bg-bg-main px-5 pt-[max(3.5rem,env(safe-area-inset-top))]">
                <Button variant="secondary" onClick={() => router.push(routes.lists)}>
                    Volver a listas
                </Button>
                <p className="mt-4 rounded-3xl border border-feedback-error-border bg-feedback-error-bg p-5 text-sm font-medium text-error">
                    {`Ya no tienes permisos para acceder a la lista "${listName}".`}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-bg-main pb-[calc(6rem+env(safe-area-inset-bottom))]">
            <Toast toast={toast}/>

            <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-370 items-start gap-4">
                    <button
                        type="button"
                        onClick={() => router.push(routes.listDetail(listId))}
                        className="grid size-11 shrink-0 place-items-center rounded-full border border-divider bg-white text-text-primary shadow-[0_6px_18px_rgba(31,42,36,0.06)] transition motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95"
                        aria-label="Volver al detalle"
                    >
                        <ArrowLeft size={20}/>
                    </button>

                    <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted">
                            Colaboración
                        </p>
                        <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-normal text-text-primary">
                            Compartir lista
                        </h1>
                        <p className="mt-1 truncate text-[15px] font-medium text-text-muted">
                            {listName}
                        </p>

                        {!canInvite && !isSharingLoading ? (
                            <p className="mt-4 rounded-3xl border border-divider bg-white px-4 py-3 text-sm font-semibold text-text-muted shadow-sm">
                                No tienes permisos para invitar colaboradores.
                            </p>
                        ) : null}
                    </div>
                </div>
            </header>

            <main
                className="mx-auto grid w-full max-w-370 gap-5 px-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)] lg:px-8">
                <section className="space-y-5">
                    <Panel>
                        <PanelHeader
                            icon={<Mail size={18}/>}
                            title="Invitar por correo"
                            description="El enlace de invitación caduca en 24 horas."
                        />

                        <div className="mt-5 space-y-4">
                            <Input
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                leftIcon={Mail}
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="correo@ejemplo.com"
                                status={emailError ? "error" : "default"}
                                errorMessage={emailError ?? undefined}
                                disabled={!canInvite || isSubmittingInvite}
                            />

                            <SegmentedRolePicker
                                value={emailRole}
                                allowedRoles={allowedRoles}
                                onChange={setEmailRole}
                                disabled={!canInvite || isSubmittingInvite}
                            />

                            {isOwner ? (
                                <InvitePermissionToggle
                                    checked={emailCanInvite}
                                    onCheckedChange={setEmailCanInvite}
                                    disabled={isSubmittingInvite}
                                />
                            ) : null}

                            <Button
                                fullWidth
                                size="lg"
                                className="rounded-3xl"
                                disabled={isInviteDisabled}
                                onClick={handleInviteByEmail}
                            >
                                {inviteButtonState === "loading"
                                    ? "Enviando..."
                                    : inviteButtonState === "success"
                                        ? "Invitación enviada"
                                        : "Enviar invitación"}
                            </Button>
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader
                            icon={<Link2 size={18}/>}
                            title="Enlace de invitación"
                            description="Crea un enlace abierto y de un solo uso para esta lista."
                        />

                        <div className="mt-5 space-y-4">
                            <SegmentedRolePicker
                                value={linkRole}
                                allowedRoles={allowedRoles}
                                onChange={setLinkRole}
                                disabled={!canInvite || isGeneratingLink}
                            />

                            {isOwner ? (
                                <InvitePermissionToggle
                                    checked={linkCanInvite}
                                    onCheckedChange={setLinkCanInvite}
                                    disabled={isGeneratingLink}
                                />
                            ) : null}

                            <div className="flex items-center gap-3 rounded-3xl border border-divider bg-bg-main p-3">
                                <div className="min-w-0 flex-1 px-1">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                        {generatedLink ? displayLink(generatedLink) : "Genera una invitación para obtener un enlace."}
                                    </p>
                                    <p className="mt-1 text-xs text-text-muted">
                                        {generatedLink ? "Último enlace generado" : "Aparecerá aquí cuando esté listo."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCopyGeneratedLink}
                                    className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-brand-active shadow-sm transition motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 disabled:opacity-50"
                                    aria-label="Copiar enlace"
                                >
                                    {copiedLink ? <Check size={18}/> : <Copy size={18}/>}
                                </button>
                            </div>

                            <Button
                                variant="outline"
                                fullWidth
                                className="rounded-3xl"
                                disabled={!canInvite || isGeneratingLink}
                                onClick={handleGenerateOpenLink}
                            >
                                {isGeneratingLink ? "Generando..." : "Generar enlace"}
                            </Button>
                        </div>
                    </Panel>
                </section>

                <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                    <Panel>
                        <div className="flex items-center justify-between gap-3">
                            <PanelHeader
                                icon={<ShieldCheck size={18}/>}
                                title="Colaboradores actuales"
                                description={`${collaborators.length} miembro${collaborators.length === 1 ? "" : "s"}`}
                                compact
                            />
                        </div>

                        <div className="mt-5 space-y-3">
                            {isSharingLoading ? (
                                <CollaboratorSkeleton/>
                            ) : collaborators.length > 0 ? (
                                collaborators.map((member) => (
                                    <CollaboratorRow
                                        key={member.id}
                                        member={member}
                                        isOwner={isOwner}
                                        isConfirming={confirmRemoveId === member.id}
                                        onAskRemove={() => setConfirmRemoveId(member.id)}
                                        onCancelRemove={() => setConfirmRemoveId(null)}
                                        onRemove={() => handleRemove(member)}
                                        onCanInviteChange={(nextValue) => handleCanInviteChange(member, nextValue)}
                                    />
                                ))
                            ) : (
                                <EmptyState/>
                            )}
                        </div>
                    </Panel>

                    {pendingInvites.length > 0 ? (
                        <Panel>
                            <PanelHeader
                                icon={<Mail size={18}/>}
                                title="Invitaciones pendientes"
                                description="Todavía no se han aceptado."
                                compact
                            />

                            <div className="mt-5 space-y-3">
                                {pendingInvites.map((invite) => (
                                    <div key={invite.id} className="rounded-3xl border border-divider bg-bg-main p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-text-primary">
                                                    {invite.email ?? "Enlace abierto"}
                                                </p>
                                                <p className="mt-1 text-xs text-text-muted">
                                                    {roleLabels[invite.role]} · caduca {formatDate(invite.expiresAt)}
                                                </p>
                                                {invite.canInvite ? (
                                                    <p className="mt-2 inline-flex rounded-full bg-brand/12 px-2.5 py-1 text-[11px] font-bold text-brand-active">
                                                        Puede invitar
                                                    </p>
                                                ) : null}
                                            </div>

                                            {isOwner ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevokeInvite(invite)}
                                                    className="rounded-full bg-white px-3 py-2 text-xs font-bold text-error shadow-sm transition motion-safe:hover:-translate-y-0.5"
                                                >
                                                    Revocar
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    ) : null}
                </aside>
            </main>
        </div>
    );
}

function Panel({children}: { children: React.ReactNode }) {
    return (
        <section
            className="rounded-3xl border border-divider bg-white p-5 shadow-[0_12px_34px_rgba(31,42,36,0.06)] sm:p-6">
            {children}
        </section>
    );
}

function PanelHeader({
                         icon,
                         title,
                         description,
                         compact = false,
                     }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    compact?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/12 text-brand-active">
                {icon}
            </span>
            <div className="min-w-0">
                <h2 className={compact ? "text-[15px] font-extrabold text-text-primary" : "text-lg font-extrabold text-text-primary"}>
                    {title}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                    {description}
                </p>
            </div>
        </div>
    );
}

function SegmentedRolePicker({
                                 value,
                                 allowedRoles,
                                 disabled,
                                 onChange,
                             }: {
    value: ShareRole;
    allowedRoles: ShareRole[];
    disabled?: boolean;
    onChange: (role: ShareRole) => void;
}) {
    return (
        <div className="grid grid-cols-2 rounded-3xl border border-divider bg-bg-main p-1">
            {roleOptions.map((option) => {
                const isAllowed = allowedRoles.includes(option.id);
                const active = value === option.id;

                return (
                    <button
                        key={option.id}
                        type="button"
                        disabled={disabled || !isAllowed}
                        onClick={() => onChange(option.id)}
                        className={[
                            "min-h-11 rounded-2xl px-3 text-sm font-bold transition",
                            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/20",
                            active ? "bg-white text-text-primary shadow-sm" : "text-text-muted",
                            !isAllowed ? "cursor-not-allowed opacity-35" : "motion-safe:hover:text-text-primary",
                        ].join(" ")}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function InvitePermissionToggle({
                                    checked,
                                    disabled,
                                    onCheckedChange,
                                }: {
    checked: boolean;
    disabled?: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-divider bg-bg-main px-4 py-3">
            <div>
                <p className="text-sm font-bold text-text-primary">Puede invitar</p>
                <p className="mt-0.5 text-xs text-text-muted">Solo el propietario puede conceder este permiso.</p>
            </div>
            <Toggle checked={checked} disabled={disabled} onCheckedChange={onCheckedChange}/>
        </div>
    );
}

function CollaboratorRow({
                             member,
                             isOwner,
                             isConfirming,
                             onAskRemove,
                             onCancelRemove,
                             onRemove,
                             onCanInviteChange,
                         }: {
    member: ListCollaborator;
    isOwner: boolean;
    isConfirming: boolean;
    onAskRemove: () => void;
    onCancelRemove: () => void;
    onRemove: () => void;
    onCanInviteChange: (checked: boolean) => void;
}) {
    const canManage = isOwner && member.role !== "OWNER";

    return (
        <article className="rounded-3xl border border-divider bg-bg-main p-4">
            <div className="flex items-center gap-3">
                <Avatar initials={member.initials} color={member.color} size="lg"/>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-text-primary">{member.name}</p>
                    {member.email ? (
                        <p className="mt-0.5 truncate text-xs text-text-muted">{member.email}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <RoleBadge role={member.role}/>
                        {member.canInvite ? (
                            <span
                                className="rounded-full bg-brand/12 px-2.5 py-1 text-[11px] font-bold text-brand-active">
                                Puede invitar
                            </span>
                        ) : null}
                    </div>
                </div>

                {canManage ? (
                    <button
                        type="button"
                        onClick={onAskRemove}
                        className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-bold text-error shadow-sm transition motion-safe:hover:-translate-y-0.5"
                    >
                        Revocar
                    </button>
                ) : null}
            </div>

            {canManage ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
                    <span className="text-xs font-semibold text-text-muted">Permiso para invitar</span>
                    <Toggle
                        checked={member.canInvite}
                        onCheckedChange={onCanInviteChange}
                        aria-label={`Cambiar permiso de invitación de ${member.name}`}
                    />
                </div>
            ) : null}

            {isConfirming ? (
                <div className="mt-3 rounded-2xl border border-feedback-error-border bg-feedback-error-bg p-3">
                    <p className="text-xs font-semibold text-error">
                        Perderá acceso inmediatamente.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={onCancelRemove}
                            className="min-h-10 rounded-2xl bg-white text-sm font-bold text-text-primary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onRemove}
                            className="min-h-10 rounded-2xl bg-error text-sm font-bold text-white"
                        >
                            Revocar
                        </button>
                    </div>
                </div>
            ) : null}
        </article>
    );
}

function RoleBadge({role}: { role: CollaboratorRole }) {
    const className = role === "OWNER"
        ? "bg-brand text-white"
        : role === "EDITOR"
            ? "bg-brand/12 text-brand-active"
            : "bg-divider text-text-muted";

    return (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${className}`}>
            {roleBadges[role]}
        </span>
    );
}

function CollaboratorSkeleton() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-3xl border border-divider bg-bg-main p-4">
                    <div className="size-10 animate-pulse rounded-full bg-divider"/>
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3 w-32 animate-pulse rounded-full bg-divider"/>
                        <div className="h-2.5 w-24 animate-pulse rounded-full bg-divider"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-3xl border border-divider bg-bg-main p-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-white text-text-muted shadow-sm">
                <UserRound size={20}/>
            </div>
            <p className="mt-3 text-sm font-bold text-text-primary">Sin colaboradores visibles</p>
            <p className="mt-1 text-xs text-text-muted">Cuando alguien acepte una invitación aparecerá aquí.</p>
        </div>
    );
}

function Toast({toast}: { toast: ToastState }) {
    if (!toast) return null;

    const isError = toast.tone === "error";
    const toneClass = isError
        ? "border-feedback-error-border bg-feedback-error-bg text-error"
        : toast.tone === "success"
            ? "border-feedback-success-border bg-feedback-success-bg text-brand-active"
            : "border-divider bg-white text-text-primary";

    return (
        <div
            className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-50 flex justify-center px-5"
            aria-live={isError ? undefined : "polite"}
        >
            <div
                role={isError ? "alert" : undefined}
                className={`max-w-md rounded-full border px-4 py-3 text-sm font-bold shadow-[0_12px_34px_rgba(31,42,36,0.14)] ${toneClass}`}
            >
                {toast.message}
            </div>
        </div>
    );
}
