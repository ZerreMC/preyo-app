"use client";

import type {ReactNode} from "react";
import {usePathname} from "next/navigation";
import {BottomNav} from "@/widgets/bottom-nav/BottomNav";

interface AppShellProps {
    children: ReactNode;
}

/** Routes where BottomNav is rendered — must mirror BottomNav's own logic. */
const MAIN_ROUTES = new Set(["/", "/lists", "/compare", "/settings", "/profile"]);

function hasBottomNav(pathname: string): boolean {
    if (MAIN_ROUTES.has(pathname)) return true;
    if (pathname.startsWith("/lists/")) return false;
    return false;
}

export function AppShell({children}: AppShellProps) {
    const pathname = usePathname();
    const showNav = hasBottomNav(pathname);

    return (
        <div className="min-h-dvh bg-[linear-gradient(135deg,#ECF8EE_0%,#FFF4E8_50%,#ECF8EE_100%)] text-text-primary">
            <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col">
                <main className={`flex-1 px-4 sm:px-6 md:px-8 pt-6 ${showNav ? "pb-24" : "pb-0"}`}>
                    {children}
                </main>

                <BottomNav/>
            </div>
        </div>
    );
}