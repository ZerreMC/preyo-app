"use client";

import type {ReactNode} from "react";
import {useMemo, useState} from "react";
import {usePathname} from "next/navigation";
import {BottomNav} from "@/widgets/bottom-nav/BottomNav";
import Sidebar from "./Sidebar";
import {TopBar} from "./TopBar";
import {LayoutContext} from "./LayoutContext";

interface AppShellProps {
    children: ReactNode;
    displayName?: string;
    initials?: string;
}

const MAIN_ROUTES = new Set(["/", "/lists", "/compare", "/app/comparador", "/settings", "/profile"]);

function hasBottomNav(pathname: string): boolean {
    if (MAIN_ROUTES.has(pathname)) return true;
    if (pathname.startsWith("/lists/")) return false;
    return false;
}

export function AppShell({children, displayName, initials}: AppShellProps) {
    const pathname = usePathname();
    const showNav = hasBottomNav(pathname);
    const hasIntelligencePanel = pathname === "/";

    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
    const [intelligenceVisible, setIntelligenceVisible] = useState(true);
    const [intelligenceMobileOpen, setIntelligenceMobileOpen] = useState(false);

    const layout = useMemo(
        () => ({
            sidebarVisible,
            setSidebarVisible,
            toggleSidebar: () => setSidebarVisible((value) => !value),

            sidebarMobileOpen,
            openSidebarMobile: () => setSidebarMobileOpen(true),
            closeSidebarMobile: () => setSidebarMobileOpen(false),
            toggleSidebarMobile: () => setSidebarMobileOpen((value) => !value),

            intelligenceVisible,
            setIntelligenceVisible,
            toggleIntelligence: () => setIntelligenceVisible((value) => !value),

            intelligenceMobileOpen,
            openIntelligenceMobile: () => setIntelligenceMobileOpen(true),
            closeIntelligenceMobile: () => setIntelligenceMobileOpen(false),
            toggleIntelligenceMobile: () => setIntelligenceMobileOpen((value) => !value),
        }),
        [sidebarVisible, sidebarMobileOpen, intelligenceVisible, intelligenceMobileOpen],
    );

    return (
        <LayoutContext.Provider value={layout}>
            <div className="min-h-dvh text-text-primary bg-bg-main lg:h-screen lg:overflow-hidden lg:flex lg:flex-row">
                {/* Sidebar desktop */}
                {sidebarVisible ? (
                    <aside className="hidden lg:flex shrink-0">
                        <Sidebar displayName={displayName} initials={initials}/>
                    </aside>
                ) : null}

                {/* Sidebar mobile drawer */}
                {sidebarMobileOpen ? (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-text-primary/45"
                            aria-label="Cerrar menú"
                            onClick={layout.toggleSidebarMobile}
                        />

                        <aside className="relative h-full w-72 max-w-[82vw] bg-white shadow-xl">
                            <Sidebar displayName={displayName} initials={initials}/>
                        </aside>
                    </div>
                ) : null}

                {/* Main column */}
                <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
                    {/* TopBar siempre visible */}
                    <div className="shrink-0 w-full">
                        <TopBar displayName={displayName} initials={initials} hasIntelligencePanel={hasIntelligencePanel}/>
                    </div>

                    <main
                        className={[
                            "flex-1 min-w-0 lg:overflow-y-auto",
                            "px-4 sm:px-6 md:px-8 lg:px-0",
                            showNav ? "pb-24 lg:pb-0" : "pb-0",
                        ].join(" ")}
                    >
                        {children}
                    </main>

                    {showNav ? (
                        <div className="lg:hidden">
                            <BottomNav/>
                        </div>
                    ) : null}
                </div>
            </div>
        </LayoutContext.Provider>
    );
}
