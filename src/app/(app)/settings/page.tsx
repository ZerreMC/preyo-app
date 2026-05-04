import Link from "next/link";
import {
    Bell,
    Car,
    ChevronRight,
    Crown,
    ShoppingBag,
    ShoppingCart,
    TrendingDown,
    Users,
} from "lucide-react";

import {SignOutButton} from "@/features/auth";
import {Avatar, Toggle} from "@/shared/ui";
import {cn} from "@/shared/lib";
import React from "react";

type Stat = {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
};

type Chip = { emoji: string; label: string };
type Store = { name: string; rank: "#1" | "#2" | "#3"; tone: "green" | "blue" | "sky" };

export default function SettingsPage() {
    const user = {
        name: "A Test",
        email: "a@test",
        plan: "Premium",
        since: "desde enero 2024",
        initials: "AG",
    };

    const stats: Stat[] = [
        {icon: ShoppingBag, value: "127,40 €", label: "Este mes"},
        {icon: TrendingDown, value: "18,20 €", label: "Ahorrado"},
        {icon: ShoppingCart, value: "24", label: "Listas"},
    ];

    const chips: Chip[] = [
        {emoji: "🥛", label: "Leche"},
        {emoji: "🍌", label: "Plátanos"},
        {emoji: "🍞", label: "Pan"},
        {emoji: "🫒", label: "Aceite"},
        {emoji: "🥚", label: "Huevos"},
    ];

    const stores: Store[] = [
        {name: "Mercadona", rank: "#1", tone: "green"},
        {name: "Lidl", rank: "#2", tone: "blue"},
        {name: "Carrefour", rank: "#3", tone: "sky"},
    ];

    return (
        <section className="mx-auto max-w-md space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar initials={user.initials} size="lg" color="#39B86B"/>
                    <span
                        className="absolute bottom-0 right-0 block size-3 rounded-full border-2 border-white bg-brand"/>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-black text-text-primary">{user.name}</p>
                    <p className="truncate text-sm text-text-muted">{user.email}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(246,201,76,0.35)] px-3 py-1 text-[11px] font-bold text-text-primary">
              <Crown className="size-3.5"/>
                {user.plan}
            </span>
                        <span className="text-[11px] text-text-muted">{user.since}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl border border-divider bg-white/70 p-3 text-center shadow-sm backdrop-blur-md"
                    >
                        <s.icon className="mx-auto mb-1.5 size-4 text-brand-active"/>
                        <p className="text-base font-black text-text-primary">{s.value}</p>
                        <p className="text-[11px] font-medium text-text-muted">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Chips */}
            <div className="space-y-3">
                <h2 className="text-base font-black text-text-primary">Tus productos habituales</h2>
                <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    style={{scrollbarWidth: "none"}}
                >
                    {chips.map((c) => (
                        <span
                            key={c.label}
                            className="flex shrink-0 items-center gap-2 rounded-full border border-divider bg-white/70 px-3 py-2 text-[13px] font-semibold text-text-primary"
                        >
              <span aria-hidden="true">{c.emoji}</span>
                            {c.label}
            </span>
                    ))}
                </div>
            </div>

            {/* Stores */}
            <div className="space-y-3">
                <h2 className="text-base font-black text-text-primary">Supermercados preferidos</h2>

                <div className="grid grid-cols-3 gap-3">
                    {stores.map((s) => (
                        <div
                            key={s.name}
                            className={cn(
                                "rounded-2xl p-4 text-center",
                                s.tone === "green" && "bg-emerald-50",
                                s.tone === "blue" && "bg-blue-50",
                                s.tone === "sky" && "bg-sky-50",
                            )}
                        >
                            <div className="mx-auto mb-2 size-6 rounded-full bg-white shadow-sm"/>
                            <p className="text-sm font-black text-text-primary">{s.name}</p>
                            <p className="mt-1 text-[11px] font-bold text-brand-active">{s.rank}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hogar */}
            <div className="space-y-3">
                <p className="text-xs font-black tracking-wide text-text-muted">HOGAR</p>

                <div
                    className="overflow-hidden rounded-3xl border border-divider bg-white/70 shadow-sm backdrop-blur-md">
                    <SettingsRow
                        icon={<Users className="size-5 text-brand-active"/>}
                        label="Compartir hogar"
                        description="Marc Puig · Júlia Martí"
                        href="#"
                    />
                    <Divider/>
                    <SettingsRow
                        icon={<Car className="size-5 text-brand-active"/>}
                        label="Transporte"
                        description="Coche · 2 bolsas"
                        href="#"
                    />
                </div>
            </div>

            {/* Preferencias */}
            <div className="space-y-3">
                <p className="text-xs font-black tracking-wide text-text-muted">PREFERENCIAS</p>

                <div
                    className="overflow-hidden rounded-3xl border border-divider bg-white/70 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-4 px-4 py-4">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-bg-soft">
                            <Bell className="size-5 text-brand-active"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-text-primary">Notificaciones</p>
                            <p className="text-xs text-text-muted">Avisos de compra y ahorro</p>
                        </div>

                        {/* Uncontrolled para test rápido */}
                        <Toggle defaultChecked/>
                    </div>
                </div>
            </div>

            {/* Sesión */}
            <div className="space-y-3">
                <p className="text-xs font-black tracking-wide text-text-muted">SESIÓN</p>
                <div className="rounded-3xl border border-divider bg-white/70 p-4 shadow-sm backdrop-blur-md">
                    <SignOutButton/>
                </div>
            </div>
        </section>
    );
}

function Divider() {
    return <div className="h-px w-full bg-divider"/>;
}

function SettingsRow({
                         icon,
                         label,
                         description,
                         href,
                     }: {
    icon: React.ReactNode;
    label: string;
    description?: string;
    href: string;
}) {
    return (
        <Link href={href} className="flex items-center gap-4 px-4 py-4">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-bg-soft">
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{label}</p>
                {description ? (
                    <p className="truncate text-xs text-text-muted">{description}</p>
                ) : null}
            </div>

            <ChevronRight className="size-5 text-text-muted"/>
        </Link>
    );
}