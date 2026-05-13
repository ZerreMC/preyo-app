"use client";

import Link from "next/link";
import Image from "next/image";
import {motion} from "motion/react";
import {
    Bell,
    ChevronRight,
    Plus,
    TrendingDown,
    Zap,
} from "lucide-react";
import {AvatarStack} from "@/shared/ui";

type Collaborator = { id: string; initials: string; color: string };

type ActiveList = {
    id: string;
    title: string;
    progress: number;
    checkedCount: number;
    totalCount: number;
    estimatedTotalLabel: string;
    subtitle: string;
    imageSrc: string;
    collaborators: Collaborator[];
};

type Product = {
    id: string;
    name: string;
    priceLabel: string;
    imageSrc: string;
};

type Supermarket = {
    id: string;
    name: string;
    emoji: string;
    bgClassName: string;
    textClassName: string;
};

type RecentList = {
    id: string;
    title: string;
    meta: string;
    status: "en-compra" | "borrador" | "plantilla" | "compartida" | "completada";
    emoji: string;
};

export type HomeScreenProps = {
    greeting: string;
    displayName: string;
    activeList?: ActiveList | null;
    savings?: { title: string; subtitle: string; amountLabel: string } | null;
    quickActions: {
        primary: { href: string; label: string; sub: string };
        secondary: { href: string; label: string; sub: string };
    };
    volverAComprar?: Product[];
    recentLists: RecentList[];
    supermarkets?: Supermarket[];
    recommendation?: { title: string; subtitle: string; imageSrc: string } | null;
};

function StatusBadge({status}: { status: RecentList["status"] }) {
    const map: Record<RecentList["status"], { label: string; className: string }> = {
        "en-compra": {label: "En compra", className: "bg-[rgba(57,184,107,0.14)] text-brand-active"},
        borrador: {label: "Borrador", className: "bg-divider text-text-muted"},
        plantilla: {label: "Plantilla", className: "bg-[rgba(255,138,61,0.14)] text-[#A05A2C]"},
        compartida: {label: "Compartida", className: "bg-[#EDF0FF] text-[#4557DB]"},
        completada: {label: "Completada", className: "bg-[rgba(57,184,107,0.12)] text-brand-active"},
    };

    const s = map[status];
    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${s.className}`}>
      {s.label}
    </span>
    );
}

function ProgressRing({progress}: { progress: number }) {
    const r = 28;
    const circumference = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(1, progress));
    const dashOffset = circumference * (1 - clamped);
    const pct = Math.round(clamped * 100);

    return (
        <div className="relative size-16">
            <svg className="size-full -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5"/>
                <circle
                    cx="32"
                    cy="32"
                    r={r}
                    fill="none"
                    stroke="white"
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
                <span className="text-white text-[16px] font-extrabold">{pct}%</span>
            </div>
        </div>
    );
}

export function HomeScreen(props: HomeScreenProps) {
    const {greeting, displayName, activeList} = props;

    return (
        <div className="min-h-dvh">
            {/* Header */}
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
                <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}}>
                    <p className="text-[13px] font-medium text-text-muted">{greeting}</p>
                    <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-text-primary">
                        Hola, {displayName} 👋
                    </h1>
                </motion.div>

                <motion.button
                    type="button"
                    initial={{opacity: 0, scale: 0.9}}
                    animate={{opacity: 1, scale: 1}}
                    className="relative grid size-11 place-items-center rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-divider"
                    aria-label="Notificaciones"
                >
                    <Bell size={20} className="text-text-primary"/>
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-brand" aria-hidden="true"/>
                </motion.button>
            </div>

            {/* Active List Hero Card */}
            {activeList ? (
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.05}}
                    className="mx-5 mb-4"
                >
                    <div
                        className="relative overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(57,184,107,0.30)] bg-[linear-gradient(135deg,var(--color-brand)_0%,var(--color-brand-active)_100%)]">
                        {activeList.imageSrc ? (
                            <div className="absolute inset-0 opacity-[0.14]">
                                <Image
                                    src={activeList.imageSrc}
                                    alt=""
                                    fill
                                    priority
                                    className="object-cover"
                                    sizes="430px"
                                />
                            </div>
                        ) : null}

                        <div className="relative p-5">
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                        🛒 En compra
                      </span>
                                    </div>

                                    <h2 className="text-[21px] font-bold tracking-[-0.3px] text-white">
                                        {activeList.title}
                                    </h2>
                                    <p className="text-[13px] font-normal text-white/75">
                                        {activeList.subtitle}
                                    </p>
                                </div>

                                <ProgressRing progress={activeList.progress}/>
                            </div>

                            <div className="mb-4 flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="grid size-5 place-items-center rounded-full bg-white/20">
                                        <span className="text-[10px] text-white">✓</span>
                                    </div>
                                    <span className="text-[13px] font-medium text-white">
                      {activeList.checkedCount}/{activeList.totalCount} productos
                    </span>
                                </div>
                                {activeList.estimatedTotalLabel ? (
                                    <>
                                        <div className="size-1 rounded-full bg-white/40"/>
                                        <span className="text-[13px] font-medium text-white">
                          Est. {activeList.estimatedTotalLabel}
                        </span>
                                    </>
                                ) : null}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AvatarStack
                                        avatars={activeList.collaborators}
                                        size="sm"
                                        max={3}
                                    />
                                    <span className="text-[12px] text-white/75">
                      {activeList.collaborators.length} colaboradores
                    </span>
                                </div>

                                <Link
                                    href="/lists"
                                    className="flex items-center gap-1.5 rounded-2xl bg-[rgba(255,255,255,0.22)] px-4 py-2 backdrop-blur-md"
                                >
                                    <span className="text-[13px] font-semibold text-white">Ver lista</span>
                                    <ChevronRight size={14} className="text-white"/>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : null}

            {/* Savings Strip */}
            {props.savings ? (
                <motion.div
                    initial={{opacity: 0, y: 16}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.1}}
                    className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-[#F0C84A] bg-[rgba(246,201,76,0.35)] px-4 py-3"
                >
                    <div className="grid size-9 place-items-center rounded-xl bg-[rgba(246,201,76,1)]">
                        <TrendingDown size={18} className="text-text-primary" strokeWidth={2.5}/>
                    </div>
                    <div className="flex-1">
                        <p className="text-[13px] font-bold text-text-primary">{props.savings.title}</p>
                        <p className="text-[12px] text-text-muted">{props.savings.subtitle}</p>
                    </div>
                    <span className="text-[17px] font-extrabold tabular-nums text-text-primary">
              {props.savings.amountLabel}
            </span>
                </motion.div>
            ) : null}

            {/* Quick actions */}
            <div className="mb-5 px-5">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        {
                            icon: Plus,
                            label: props.quickActions.primary.label,
                            sub: props.quickActions.primary.sub,
                            href: props.quickActions.primary.href,
                            bgClass: "bg-[rgba(57,184,107,0.14)]",
                            iconColorClass: "text-brand-active",
                        },
                        {
                            icon: Zap,
                            label: props.quickActions.secondary.label,
                            sub: props.quickActions.secondary.sub,
                            href: props.quickActions.secondary.href,
                            bgClass: "bg-[rgba(255,138,61,0.14)]",
                            iconColorClass: "text-[#B8520A]",
                        },
                    ].map((item) => (
                        <motion.div key={item.label} whileTap={{scale: 0.97}}>
                            <Link
                                href={item.href}
                                className={`flex items-center gap-3 rounded-2xl border border-black/5 p-4 text-left ${item.bgClass}`}
                            >
                                <div className="grid size-10 place-items-center rounded-xl bg-white/60">
                                    <item.icon size={20} className={item.iconColorClass}/>
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-text-primary">{item.label}</p>
                                    <p className="text-[11px] text-text-muted">{item.sub}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Volver a comprar */}
            {props.volverAComprar && props.volverAComprar.length > 0 ? (
                <div className="mb-5">
                    <div className="mb-3 flex items-center justify-between px-5">
                        <h3 className="text-[17px] font-bold text-text-primary">Volver a comprar</h3>
                        <Link href="/compare" className="text-[13px] font-semibold text-brand">
                            Ver todo
                        </Link>
                    </div>

                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                        {props.volverAComprar.slice(0, 6).map((p) => (
                            <motion.div
                                key={p.id}
                                whileTap={{scale: 0.96}}
                                className="w-24 shrink-0 overflow-hidden rounded-2xl border border-divider bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                            >
                                <div className="relative h-20 bg-[rgba(255,244,232,1)]">
                                    <Image
                                        src={p.imageSrc}
                                        alt={p.name}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                    />
                                </div>
                                <div className="p-2">
                                    <p className="mb-1 line-clamp-2 text-[10px] font-semibold leading-tight text-text-primary">
                                        {p.name}
                                    </p>
                                    <p className="text-[11px] font-bold text-brand">{p.priceLabel}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Mis listas */}
            <div className="mb-5">
                <div className="mb-3 flex items-center justify-between px-5">
                    <h3 className="text-[17px] font-bold text-text-primary">Mis listas</h3>
                    <Link href="/lists" className="text-[13px] font-semibold text-brand">
                        Ver todas
                    </Link>
                </div>

                {props.recentLists.length === 0 ? (
                    <div className="mx-5 rounded-2xl border border-divider bg-white/70 px-4 py-6 text-center">
                        <p className="text-[14px] font-semibold text-text-primary">Todavía no tienes listas</p>
                        <p className="mt-1 text-[12px] text-text-muted">Crea tu primera lista para empezar</p>
                        <Link
                            href="/lists/new"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-brand px-4 py-2 text-[13px] font-semibold text-white"
                        >
                            <Plus size={14}/>
                            Nueva lista
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5 px-5">
                        {props.recentLists.slice(0, 3).map((list, i) => (
                            <motion.div
                                key={list.id}
                                initial={{opacity: 0, y: 16}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.1 + i * 0.04}}
                                whileTap={{scale: 0.98}}
                            >
                                <Link
                                    href="/lists"
                                    className="flex w-full items-center gap-3 rounded-2xl border border-divider bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                                >
                                    <div
                                        className="grid size-11 place-items-center rounded-2xl bg-[rgba(57,184,107,0.14)] text-xl">
                                        {list.emoji}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[14px] font-bold text-text-primary">{list.title}</p>
                                        <p className="text-[12px] text-text-muted">{list.meta}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={list.status}/>
                                        <ChevronRight size={16} className="text-text-muted"/>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Supermercados */}
            {props.supermarkets && props.supermarkets.length > 0 ? (
                <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between px-5">
                        <h3 className="text-[17px] font-bold text-text-primary">Supermercados</h3>
                        <Link href="/compare" className="text-[13px] font-semibold text-brand">
                            Ver todos
                        </Link>
                    </div>

                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                        {props.supermarkets.slice(0, 4).map((s) => (
                            <motion.div key={s.id} whileTap={{scale: 0.96}}>
                                <Link
                                    href="/compare"
                                    className={`flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-black/5 px-5 py-3 ${s.bgClassName}`}
                                >
                                    <span className="text-2xl">{s.emoji}</span>
                                    <span className={`text-[11px] font-bold ${s.textClassName}`}>{s.name}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Recommendation teaser */}
            {props.recommendation ? (
                <div className="mb-6 px-5">
                    <motion.div
                        whileTap={{scale: 0.98}}
                        className="relative overflow-hidden rounded-3xl border border-divider bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                    >
                        <Link href="/compare" className="flex items-center gap-3 p-4">
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-[rgba(255,244,232,1)]">
                                <Image
                                    src={props.recommendation.imageSrc}
                                    alt="Recomendación"
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="mb-0.5 flex items-center gap-2">
                    <span
                        className="rounded-full bg-[rgba(246,201,76,0.35)] px-2 py-0.5 text-[10px] font-bold text-[#8B6914]">
                      💡 Recomendación
                    </span>
                                </div>
                                <p className="text-[13px] font-bold leading-[1.3] text-text-primary">
                                    {props.recommendation.title}
                                </p>
                                <p className="text-[11px] text-text-muted">{props.recommendation.subtitle}</p>
                            </div>
                        </Link>
                    </motion.div>
                </div>
            ) : null}

            {/* espacio para BottomNav */}
            <div className="h-[calc(6rem+env(safe-area-inset-bottom))]"/>
        </div>
    );
}
