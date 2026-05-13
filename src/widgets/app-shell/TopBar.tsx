"use client";

import {useState} from "react";
import {usePathname} from "next/navigation";
import {Bell, ChevronRight, Search, Menu, X, Zap} from "lucide-react";
import Link from "next/link";
import {useLayout} from "@/widgets/app-shell/LayoutContext";

const BREADCRUMBS: Record<string, string[]> = {
    "/": ["Preyo", "Inicio"],
    "/lists": ["Preyo", "Mis Listas"],
    "/compare": ["Preyo", "Comparador"],
    "/settings": ["Preyo", "Ajustes"],
};

interface TopBarProps {
    displayName?: string;
    initials?: string;
    hasIntelligencePanel?: boolean;
}

export function TopBar({
                           initials,
                           hasIntelligencePanel = false,
                       }: TopBarProps) {
    const pathname = usePathname();
    const [focused, setFocused] = useState(false);
    const layout = useLayout();

    const crumbs =
        BREADCRUMBS[pathname] ??
        (pathname.startsWith("/lists/") ? ["Preyo", "Mis Listas", "Detalle"] : ["Preyo"]);

    return (
        <header className="h-15 bg-white border-b border-divider flex items-center px-5 gap-4 shrink-0 w-full">
            {/* Mobile: hamburger opens drawer */}
            <button
                type="button"
                className="lg:hidden size-9 rounded-base flex items-center justify-center"
                aria-label="Abrir menú"
                onClick={() => layout.toggleSidebarMobile()}
            >
                <Menu size={18} className="text-text-primary"/>
            </button>

            {/* Desktop: collapse/expand sidebar */}
            <button
                type="button"
                className="hidden lg:inline-flex size-9 rounded-base flex items-center justify-center"
                aria-label="Alternar sidebar"
                onClick={() => layout.toggleSidebar()}
            >
                {layout.sidebarVisible ? <X size={16} className="text-text-primary"/> :
                    <Menu size={16} className="text-text-primary"/>}
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 shrink-0">
                {crumbs.map((crumb, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight size={12} className="text-[#C7C7CC]"/>}
                        {i === 0 ? (
                            <Link href="/"
                                  className="text-[13px] font-medium text-text-muted hover:text-text-primary transition-colors">
                                {crumb}
                            </Link>
                        ) : (
                            <span
                                className={`text-[13px] ${i === crumbs.length - 1 ? "font-semibold text-text-primary" : "font-medium text-text-muted"}`}
                            >
                {crumb}
              </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-120">
                <div
                    className={`flex items-center gap-2 rounded-base px-3.5 py-2 transition-all ${
                        focused ? "bg-white border border-brand/60 shadow-[0_0_0_3px_rgba(57,184,107,0.12)]" : "bg-bg-hover border border-transparent"
                    }`}
                >
                    <Search size={15} className={focused ? "text-brand" : "text-text-muted"}/>
                    <input
                        type="search"
                        placeholder="Buscar productos, listas, tiendas..."
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="flex-1 bg-transparent border-none outline-none text-[14px] text-text-primary placeholder:text-text-muted"
                    />
                </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
                <button
                    type="button"
                    aria-label="Notificaciones"
                    className="relative size-9 rounded-base border border-divider flex items-center justify-center hover:bg-bg-hover transition-colors"
                >
                    <Bell size={16} className="text-nav-secondary"/>
                    <span
                        className="absolute top-1.75 right-1.75 size-1.5 rounded-full bg-error border-[1.5px] border-white"/>
                </button>

                {hasIntelligencePanel ? (
                    <button
                        type="button"
                        aria-label="Mostrar u ocultar panel de inteligencia"
                        className="relative size-9 rounded-base border border-divider flex items-center justify-center hover:bg-bg-hover transition-colors mr-2"
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                layout.openIntelligenceMobile();
                                return;
                            }

                            layout.toggleIntelligence();
                        }}
                    >
                        <Zap size={16} className="text-nav-secondary"/>
                    </button>
                ) : null}

                <div
                    className="size-9 rounded-base bg-brand-gradient flex items-center justify-center text-sm font-bold text-white shadow-[0_2px_6px_rgba(57,184,107,0.3)] cursor-default select-none"
                    aria-label="Avatar usuario"
                >
                    {initials ?? "?"}
                </div>
            </div>
        </header>
    );
}
