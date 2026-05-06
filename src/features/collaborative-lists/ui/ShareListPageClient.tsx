"use client";

import type {ReactNode} from "react";
import {useState, useSyncExternalStore} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft, Check, Copy, Link2, Mail, X} from "lucide-react";
import {AnimatePresence, motion} from "motion/react";
import {Avatar, Button, Input} from "@/shared/ui";
import {routes} from "@/shared/config/routes";
import {getListById, inviteMember, revokeMember, subscribeToMockLists, type InviteRole} from "../client";

type ShareListPageClientProps = {
    listId: string;
};

const roles: { id: InviteRole; label: string; description: string }[] = [
    {id: "editor", label: "Editor", description: "Puede añadir y marcar productos"},
    {id: "readonly", label: "Solo lectura", description: "Solo puede ver la lista"},
];

export function ShareListPageClient({listId}: ShareListPageClientProps) {
    const router = useRouter();
    const list = useSyncExternalStore(
        subscribeToMockLists,
        () => getListById(listId),
        () => getListById(listId),
    );
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<InviteRole>("editor");
    const [toast, setToast] = useState("");
    const [copied, setCopied] = useState(false);

    if (!list) {
        return (
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))]">
                <Button variant="secondary" onClick={() => router.push(routes.lists)}>Volver a listas</Button>
            </div>
        );
    }

    const handleInvite = () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail.includes("@")) return;
        inviteMember(list.id, normalizedEmail, role);
        setEmail("");
        setToast(`Invitación enviada a ${normalizedEmail}`);
        window.setTimeout(() => setToast(""), 2200);
    };

    const handleCopy = () => {
        const link = `https://preyo.app/join/${list.id}`;
        navigator.clipboard?.writeText(link).catch(() => undefined);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">
            <header className="sticky top-0 z-30 border-b border-white/50 bg-bg-main/95 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-4 shadow-[0_6px_18px_rgba(31,42,36,0.06)]">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => router.push(routes.listDetail(list.id))} className="grid size-9 shrink-0 place-items-center rounded-xl bg-[rgba(57,184,107,0.12)] text-brand-active">
                        <ArrowLeft size={18}/>
                    </button>
                    <div>
                        <h1 className="text-[19px] font-extrabold tracking-[-0.3px] text-text-primary">Compartir lista</h1>
                        <p className="text-[12px] text-text-muted">{list.title}</p>
                    </div>
                </div>
            </header>

            <main className="px-5 pt-5">
                <section className="mb-5 rounded-3xl border border-divider bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
                    <h2 className="mb-3 text-[13px] font-bold text-text-primary">Invitar por correo electrónico</h2>
                    <Input
                        type="email"
                        leftIcon={Mail}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="correo@ejemplo.com"
                        onKeyDown={(event) => event.key === "Enter" && handleInvite()}
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
                                        active ? "border-brand bg-[rgba(57,184,107,0.12)]" : "border-divider bg-bg-main",
                                    ].join(" ")}
                                >
                                    <span>
                                        <span className="block text-[13px] font-bold text-text-primary">{option.label}</span>
                                        <span className="block text-[11px] text-text-muted">{option.description}</span>
                                    </span>
                                    {active ? <Check size={15} className="text-brand-active"/> : null}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 rounded-xl border border-[#F6C94C]/40 bg-[#FFE9A6]/40 px-3 py-2 text-[12px] text-[#7A5A00]">
                        El enlace de invitación caduca en 24 horas.
                    </div>

                    <Button fullWidth className="mt-4 rounded-2xl" disabled={!email.includes("@")} onClick={handleInvite}>
                        Enviar invitación
                    </Button>
                </section>

                <button
                    type="button"
                    onClick={handleCopy}
                    className={[
                        "mb-5 flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                        copied ? "border-brand bg-[rgba(57,184,107,0.12)]" : "border-divider bg-white",
                    ].join(" ")}
                >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bg-soft text-text-muted">
                        {copied ? <Check size={16} className="text-brand-active"/> : <Link2 size={16}/>}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-text-primary">{copied ? "Enlace copiado" : "Copiar enlace de invitación"}</span>
                        <span className="block truncate text-[11px] text-text-muted">preyo.app/join/{list.id}</span>
                    </span>
                    <Copy size={15} className="text-text-muted"/>
                </button>

                <PeopleSection title="Colaboradores actuales">
                    {list.collaborators.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 px-4 py-3.5">
                            <Avatar initials={member.initials} color={member.color}/>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-text-primary">{member.name}</p>
                                <p className="text-[11px] text-text-muted">{member.role === "owner" ? "Propietario" : member.role === "editor" ? "Editor" : "Solo lectura"}</p>
                            </div>
                            {member.role !== "owner" ? (
                                <button type="button" onClick={() => revokeMember(list.id, member.id)} className="rounded-xl bg-[#FFF0F0] px-3 py-1.5 text-[11px] font-semibold text-error">
                                    Revocar
                                </button>
                            ) : null}
                        </div>
                    ))}
                </PeopleSection>

                <AnimatePresence initial={false}>
                    {list.pendingInvites.length > 0 ? (
                        <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}} exit={{opacity: 0, height: 0}}>
                            <PeopleSection title="Invitaciones pendientes">
                                {list.pendingInvites.map((invite) => (
                                    <div key={invite.id} className="flex items-center gap-3 px-4 py-3.5">
                                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-divider text-text-muted">
                                            <Mail size={15}/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-semibold text-text-primary">{invite.email}</p>
                                            <p className="text-[11px] text-text-muted">Pendiente · {invite.role === "editor" ? "Editor" : "Solo lectura"}</p>
                                        </div>
                                        <button type="button" onClick={() => revokeMember(list.id, invite.id)} className="grid size-8 place-items-center rounded-full bg-[#FFF0F0] text-error">
                                            <X size={13}/>
                                        </button>
                                    </div>
                                ))}
                            </PeopleSection>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {toast ? (
                    <motion.div initial={{opacity: 0, y: 24}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 24}} className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 rounded-2xl bg-text-primary px-5 py-3.5 text-[13px] font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] lg:bottom-24">
                        {toast}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function PeopleSection({title, children}: { title: string; children: ReactNode }) {
    return (
        <section className="mb-5">
            <h2 className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">{title}</h2>
            <div className="divide-y divide-divider overflow-hidden rounded-3xl border border-divider bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                {children}
            </div>
        </section>
    );
}
