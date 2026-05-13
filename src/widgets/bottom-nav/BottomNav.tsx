"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {motion} from "motion/react";
import {Home, ShoppingCart, Store, User, type LucideIcon} from "lucide-react";
import {cn} from "@/shared/lib";

const NAV_ITEMS: {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
}[] = [
    {id: "home", label: "Inicio", href: "/", icon: Home},
    {id: "lists", label: "Listas", href: "/lists", icon: ShoppingCart},
    {id: "compare", label: "Tiendas", href: "/compare", icon: Store},
    {id: "settings", label: "Perfil", href: "/settings", icon: User},
];

/** Routes where the BottomNav is visible (exact match). */
const MAIN_ROUTES = new Set(["/", "/lists", "/compare", "/settings", "/profile"]);

function shouldShowBottomNav(pathname: string): boolean {
    if (MAIN_ROUTES.has(pathname)) return true;
    // Any sub-route of /lists (e.g. /lists/abc, /lists/abc/add) → hide
    if (pathname.startsWith("/lists/")) return false;
    return false;
}

export function BottomNav() {
    const pathname = usePathname();

    if (!shouldShowBottomNav(pathname)) return null;

    return (
        <nav
            aria-label="Navegación principal"
            className="lg:hidden pointer-events-none fixed inset-x-0 bottom-0 z-70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
        >
            <motion.div
                initial={false}
                animate={{y: 0}}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                }}
                className="pointer-events-auto mx-auto w-full max-w-150 rounded-4xl border border-divider bg-white/90 backdrop-blur-md p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
            >
                <ul className="flex items-center">
                    {NAV_ITEMS.map((tab) => {
                        const isActive =
                            tab.href === "/"
                                ? pathname === tab.href
                                : pathname.startsWith(tab.href);

                        const Icon = tab.icon;

                        return (
                            <li key={tab.href} className="flex-1">
                                <Link
                                    href={tab.href}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "relative flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 py-2 text-[10px] tracking-tight transition-colors duration-200 outline-none",
                                        isActive
                                            ? "font-bold text-brand-active"
                                            : "font-normal text-text-muted hover:text-text-primary",
                                    )}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="active-bottom-tab"
                                            className="absolute inset-0 rounded-3xl bg-brand/14"
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                            }}
                                        />
                                    )}

                                    <span className="relative z-10 flex flex-col items-center gap-0.5">
                                        <Icon
                                            size={22}
                                            strokeWidth={isActive ? 2.5 : 1.8}
                                            className="transition-all duration-200"
                                        />
                                        <span>{tab.label}</span>
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </motion.div>
        </nav>
    );
}
