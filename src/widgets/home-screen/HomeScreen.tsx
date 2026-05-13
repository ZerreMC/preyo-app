"use client";

import Link from "next/link";
import Image from "next/image";
import {motion} from "motion/react";
import {
    BarChart2,
    Bell,
    ChevronRight,
    Clock,
    MapPin,
    Package,
    Plus,
    ShoppingCart,
    TrendingDown,
    Zap,
} from "lucide-react";
import {AvatarStack} from "@/shared/ui";
import {StatCard} from "./StatCard";
import {IntelligencePanel} from "./IntelligencePanel";
import {useLayout} from "@/widgets/app-shell/LayoutContext";

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
    formattedDate?: string;
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
    const map: Record<
        RecentList["status"],
        { label: string; className: string }
    > = {
        "en-compra": {
            label: "En compra",
            className: "bg-brand/14 text-brand-active",
        },
        borrador: {label: "Borrador", className: "bg-divider text-text-muted"},
        plantilla: {
            label: "Plantilla",
            className: "bg-accent-orange/14 text-status-template-text",
        },
        compartida: {
            label: "Compartida",
            className: "bg-status-shared-bg text-status-shared-text",
        },
        completada: {
            label: "Completada",
            className: "bg-brand/12 text-brand-active",
        },
    };

    const s = map[status];
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${s.className}`}
        >
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
            <svg
                className="size-full -rotate-90"
                viewBox="0 0 64 64"
                aria-hidden="true"
            >
                <circle
                    cx="32"
                    cy="32"
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="5"
                />
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

function DesktopListCard({list}: { list: RecentList }) {
    const statusMap: Record<
        RecentList["status"],
        { label: string; bg: string; text: string }
    > = {
        "en-compra": {
            label: "En compra",
            bg: "bg-brand/14",
            text: "text-brand-active",
        },
        borrador: {label: "Borrador", bg: "bg-divider", text: "text-text-muted"},
        plantilla: {
            label: "Plantilla",
            bg: "bg-accent-orange/14",
            text: "text-status-template-text",
        },
        compartida: {
            label: "Compartida",
            bg: "bg-status-shared-bg",
            text: "text-status-shared-text",
        },
        completada: {
            label: "Completada",
            bg: "bg-brand/12",
            text: "text-brand-active",
        },
    };
    const s = statusMap[list.status];
    return (
        <Link
            href="/lists"
            className="bg-white rounded-2xl p-4.5 border border-divider shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col gap-3 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-200"
        >
            <div className="flex items-start justify-between">
                <div className="size-9 rounded-base bg-brand/14 flex items-center justify-center text-lg">
                    {list.emoji}
                </div>
                <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${s.bg} ${s.text} border-transparent`}
                >
          {s.label}
        </span>
            </div>
            <div>
                <p className="text-[15px] font-bold text-text-primary mb-0.5 tracking-[-0.2px]">
                    {list.title}
                </p>
                <div className="flex items-center gap-1 text-text-muted">
                    <Clock size={11}/>
                    <span className="text-xs">{list.meta}</span>
                </div>
            </div>
        </Link>
    );
}

export function HomeScreen(props: HomeScreenProps) {
    const {greeting, displayName, activeList, recentLists, formattedDate} =
        props;
    const activeShopping = recentLists.filter(
        (l) => l.status === "en-compra",
    ).length;

    const {intelligenceVisible} = useLayout();

    return (
        <>
            {/* ── DESKTOP LAYOUT (≥ lg) ─────────────────────── */}
            <div className="hidden lg:flex min-h-full">
                {/* Main scrollable column */}
                <div className="flex-1 p-7 min-w-0 overflow-y-auto">
                    {/* ZONA 1 — Cabecera */}
                    <motion.div
                        initial={{opacity: 0, y: -8}}
                        animate={{opacity: 1, y: 0}}
                        className="mb-7"
                    >
                        {formattedDate && (
                            <p className="text-[13px] text-text-muted mb-1 capitalize">
                                {formattedDate}
                            </p>
                        )}
                        <h1 className="text-[26px] font-extrabold tracking-[-0.6px] text-text-primary">
                            {greeting}, {displayName} 👋
                        </h1>
                    </motion.div>

                    {/* ZONA 2 — Grid 4 stats */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                        <motion.div
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.07}}
                        >
                            <StatCard
                                icon={ShoppingCart}
                                label="Listas activas"
                                value={String(recentLists.length)}
                                change={
                                    activeShopping > 0
                                        ? `${activeShopping} en compra`
                                        : "Total de tus listas"
                                }
                                variant="neutral"
                            />
                        </motion.div>
                        <motion.div
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.14}}
                        >
                            <StatCard
                                icon={TrendingDown}
                                label="Ahorro en Mayo"
                                value={null}
                                change="Conecta el comparador"
                                variant="savings"
                            />
                        </motion.div>
                        <motion.div
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.21}}
                        >
                            <StatCard
                                icon={BarChart2}
                                label="Bajadas de precio"
                                value={null}
                                change="Sin datos aún"
                                variant="price-drop"
                            />
                        </motion.div>
                        <motion.div
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.28}}
                        >
                            <StatCard
                                icon={Package}
                                label="Ahorro potencial"
                                value={null}
                                change="Compara tiendas para ver"
                                variant="potential"
                            />
                        </motion.div>
                    </div>

                    {/* ZONA 3 — Grid tendencia + mejor tienda */}
                    <div className="grid grid-cols-[1fr_340px] gap-5 mb-7">
                        {/* Tendencia de ahorro — empty state */}
                        <motion.div
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.3}}
                            className="relative overflow-hidden rounded-2xl p-6 bg-[linear-gradient(135deg,#1B5E20_0%,#2E7D32_50%,#388E3C_100%)]"
                        >
                            <div
                                className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5 pointer-events-none"/>
                            <div
                                className="absolute bottom-5 right-20 size-20 rounded-full bg-white/4 pointer-events-none"/>
                            <div className="relative">
                                <p className="text-[12px] font-semibold text-white/60 uppercase tracking-[0.07em] mb-2">
                                    Tendencia de ahorro
                                </p>
                                <div className="flex flex-col items-center justify-center h-36 gap-3 text-center">
                                    <TrendingDown size={32} className="text-white/25"/>
                                    <p className="text-[14px] text-white/60">
                                        Sin historial de ahorro todavía
                                    </p>
                                    <p className="text-[12px] text-white/45">
                                        Empieza a usar el comparador para registrar tus ahorros
                                    </p>
                                    <Link
                                        href="/compare"
                                        className="text-[12px] font-semibold text-white bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 rounded-lg"
                                    >
                                        Comparar tiendas →
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Mejor tienda hoy — empty state */}
                        <motion.div
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.35}}
                            className="bg-white rounded-2xl p-5.5 border border-divider shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="size-7 rounded-lg bg-brand/14 flex items-center justify-center">
                                    <MapPin size={14} className="text-brand-active"/>
                                </div>
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.07em]">
                                    Mejor tienda hoy
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                                <p className="text-[36px] font-extrabold text-divider leading-none">
                                    —
                                </p>
                                <p className="text-[13px] text-text-muted mt-2">
                                    Añade productos a una lista para comparar precios entre
                                    tiendas
                                </p>
                                <Link
                                    href="/compare"
                                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-base bg-brand/12 border border-brand/25 text-[13px] font-bold text-brand-active hover:bg-brand/20 transition-colors"
                                >
                                    Ver comparativa completa <ChevronRight size={14}/>
                                </Link>
                            </div>
                        </motion.div>
                    </div>

                    {/* Mis listas */}
                    <motion.section
                        initial={{opacity: 0, y: 16}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.4}}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={16} className="text-text-primary"/>
                                <h2 className="text-[16px] font-bold text-text-primary">
                                    Mis listas
                                </h2>
                            </div>
                            <Link
                                href="/lists"
                                className="flex items-center gap-0.5 text-[13px] font-semibold text-brand hover:underline"
                            >
                                Ver todas <ChevronRight size={13}/>
                            </Link>
                        </div>

                        {recentLists.length === 0 ? (
                            <div
                                className="rounded-2xl border border-divider bg-white p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                <p className="text-sm font-semibold text-text-primary mb-1">
                                    Sin listas todavía
                                </p>
                                <p className="text-xs text-text-muted mb-4">
                                    Crea tu primera lista para organizar tu compra
                                </p>
                                <Link
                                    href="/lists/new"
                                    className="inline-flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-base text-[13px] font-semibold hover:bg-brand-active transition-colors"
                                >
                                    <Plus size={14}/> Nueva lista
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {recentLists.slice(0, 3).map((list) => (
                                    <DesktopListCard key={list.id} list={list}/>
                                ))}
                            </div>
                        )}
                    </motion.section>
                </div>

                {/* Right panel — inteligencia */}
                {intelligenceVisible ? (
                    <div className="w-76 shrink-0 border-l border-divider bg-white overflow-y-auto">
                        <IntelligencePanel recentLists={recentLists}/>
                    </div>
                ) : null}
            </div>

            {/* ── MOBILE LAYOUT (< lg) ─────────────────────── */}
            <div className="block lg:hidden min-h-dvh">
                {/* Header */}
                <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
                    <motion.div
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                    >
                        <p className="text-[13px] font-medium text-text-muted">
                            {greeting}
                        </p>
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
                        <span
                            className="absolute top-2 right-2 size-2 rounded-full bg-brand"
                            aria-hidden="true"
                        />
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
                      {activeList.checkedCount}/{activeList.totalCount}{" "}
                                            productos
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
                    <span className="text-[13px] font-semibold text-white">
                      Ver lista
                    </span>
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
                        className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-accent-highlight bg-accent-highlight/35 px-4 py-3"
                    >
                        <div className="grid size-9 place-items-center rounded-xl bg-accent-highlight">
                            <TrendingDown
                                size={18}
                                className="text-text-primary"
                                strokeWidth={2.5}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-[13px] font-bold text-text-primary">
                                {props.savings.title}
                            </p>
                            <p className="text-[12px] text-text-muted">
                                {props.savings.subtitle}
                            </p>
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
                                bgClass: "bg-brand/14",
                                iconColorClass: "text-brand-active",
                            },
                            {
                                icon: Zap,
                                label: props.quickActions.secondary.label,
                                sub: props.quickActions.secondary.sub,
                                href: props.quickActions.secondary.href,
                                bgClass: "bg-accent-orange/14",
                                iconColorClass: "text-quick-action-secondary",
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
                                        <p className="text-[14px] font-bold text-text-primary">
                                            {item.label}
                                        </p>
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
                            <h3 className="text-[17px] font-bold text-text-primary">
                                Volver a comprar
                            </h3>
                            <Link
                                href="/compare"
                                className="text-[13px] font-semibold text-brand"
                            >
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
                                    <div className="relative h-20 bg-bg-soft">
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
                                        <p className="text-[11px] font-bold text-brand">
                                            {p.priceLabel}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* Mis listas */}
                <div className="mb-5">
                    <div className="mb-3 flex items-center justify-between px-5">
                        <h3 className="text-[17px] font-bold text-text-primary">
                            Mis listas
                        </h3>
                        <Link
                            href="/lists"
                            className="text-[13px] font-semibold text-brand"
                        >
                            Ver todas
                        </Link>
                    </div>

                    {props.recentLists.length === 0 ? (
                        <div className="mx-5 rounded-2xl border border-divider bg-white/70 px-4 py-6 text-center">
                            <p className="text-[14px] font-semibold text-text-primary">
                                Todavía no tienes listas
                            </p>
                            <p className="mt-1 text-[12px] text-text-muted">
                                Crea tu primera lista para empezar
                            </p>
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
                                            className="grid size-11 place-items-center rounded-2xl bg-brand/14 text-xl">
                                            {list.emoji}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[14px] font-bold text-text-primary">
                                                {list.title}
                                            </p>
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
                            <h3 className="text-[17px] font-bold text-text-primary">
                                Supermercados
                            </h3>
                            <Link
                                href="/compare"
                                className="text-[13px] font-semibold text-brand"
                            >
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
                                        <span
                                            className={`text-[11px] font-bold ${s.textClassName}`}
                                        >
                      {s.name}
                    </span>
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
                                <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-bg-soft">
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
                        className="rounded-full bg-accent-highlight/35 px-2 py-0.5 text-[10px] font-bold text-recommendation-text">
                      💡 Recomendación
                    </span>
                                    </div>
                                    <p className="text-[13px] font-bold leading-[1.3] text-text-primary">
                                        {props.recommendation.title}
                                    </p>
                                    <p className="text-[11px] text-text-muted">
                                        {props.recommendation.subtitle}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                ) : null}

                {/* espacio para BottomNav */}
                <div className="h-[calc(6rem+env(safe-area-inset-bottom))]"/>
            </div>
        </>
    );
}
