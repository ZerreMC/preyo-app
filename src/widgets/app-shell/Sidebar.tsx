"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {BarChart2, Home, Package, Settings, ShoppingCart, TrendingDown} from "lucide-react";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    disabled?: boolean;
};

const NAV_MAIN: NavItem[] = [
    {label: "Inicio", icon: Home, href: "/"},
    {label: "Mis Listas", icon: ShoppingCart, href: "/lists"},
    {label: "Comparador", icon: BarChart2, href: "/compare"},
    {label: "Ahorros", icon: TrendingDown, href: "/ahorros", disabled: true},
    {label: "Productos", icon: Package, href: "/products", disabled: true},
];

const NAV_TOOLS: NavItem[] = [
    {label: "Ajustes", icon: Settings, href: "/settings"},
];

interface SidebarProps {
    displayName?: string;
    initials?: string;
}

function Sidebar({displayName, initials}: SidebarProps) {
    const pathname = usePathname();

    function isActive(href: string) {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    }

    return (
        <aside className="w-60 shrink-0 h-screen bg-white border-r border-divider flex flex-col overflow-hidden">
            {/* Logo */}
            <div className="px-4 pt-5 pb-4 border-b border-bg-hover">
                <Image
                    src="/brand/preyo-logo-horizontal.svg"
                    alt="Preyo"
                    width={96}
                    height={24}
                    className="h-7 w-auto"
                    priority
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2.5 py-3 overflow-y-auto flex flex-col gap-6">
                <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] px-3 mb-1.5">
                        Principal
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {NAV_MAIN.map((item) => {
                            const active = !item.disabled && isActive(item.href);
                            const Icon = item.icon as React.ComponentType<{
                                size?: number;
                                className?: string;
                                strokeWidth?: number
                            }>;

                            if (item.disabled) {
                                return (
                                    <div
                                        key={item.href}
                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-base opacity-40 cursor-not-allowed select-none"
                                        title="Próximamente"
                                    >
                                        <div className="size-8 rounded-lg flex items-center justify-center shrink-0">
                                            <Icon size={16} className="text-text-muted" strokeWidth={1.8}/>
                                        </div>
                                        <span className="text-[14px] font-medium text-nav-secondary flex-1">
                                            {item.label}
                                        </span>
                                        <span
                                            className="text-[9px] font-bold text-text-muted bg-divider px-1.5 py-0.5 rounded-full">
                                            Pronto
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-base transition-colors ${
                                        active
                                            ? "bg-brand/14"
                                            : "hover:bg-bg-hover"
                                    }`}
                                >
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-brand rounded-r-sm"/>
                                    )}
                                    <div
                                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                            active ? "bg-brand/25" : ""
                                        }`}
                                    >
                                        <Icon
                                            size={16}
                                            className={active ? "text-brand-active" : "text-text-muted"}
                                            strokeWidth={active ? 2.2 : 1.8}
                                        />
                                    </div>
                                    <span
                                        className={`text-sm flex-1 ${
                                            active
                                                ? "font-semibold text-brand-active"
                                                : "font-medium text-nav-secondary"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] px-3 mb-1.5">
                        Herramientas
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {NAV_TOOLS.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon as React.ComponentType<{
                                size?: number;
                                className?: string;
                                strokeWidth?: number
                            }>;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-base transition-colors ${
                                        active
                                            ? "bg-brand/14"
                                            : "hover:bg-bg-hover"
                                    }`}
                                >
                                    {active && (
                                        <span
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-brand rounded-r-sm"/>
                                    )}
                                    <div
                                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            active ? "bg-brand/25" : ""
                                        }`}
                                    >
                                        <Icon
                                            size={16}
                                            className={active ? "text-brand-active" : "text-text-muted"}
                                            strokeWidth={active ? 2.2 : 1.8}
                                        />
                                    </div>
                                    <span
                                        className={`text-sm flex-1 ${
                                            active
                                                ? "font-semibold text-brand-active"
                                                : "font-medium text-nav-secondary"
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* User footer */}
            <div className="p-3 border-t border-bg-hover">
                <div className="flex items-center gap-2.5">
                    <div
                        className="size-9 rounded-base bg-brand-gradient flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {initials ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-text-primary truncate">
                            {displayName ?? "Usuario"}
                        </p>
                        <p className="text-[11px] text-text-muted">Plan Gratuito</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar
