"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {bottomNavigationItems} from "@/shared/config/routes";
import {cn} from "@/shared/lib";

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Navegación principal"
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
        >
            <div
                className="mx-auto glass-strong rounded-4xl p-1.5">
                <ul className="flex items-center">
                    {bottomNavigationItems.map((tab) => {
                        const isActive =
                            tab.href === "/"
                                ? pathname === tab.href
                                : pathname.startsWith(tab.href);

                        return (
                            <li key={tab.href} className="flex-1">
                                <Link
                                    href={tab.href}
                                    aria-current={isActive ? "page" : undefined}
                                    className={cn(
                                        "relative flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 py-2 text-[10px] tracking-tight transition",
                                        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand focus-visible:ring-offset-2",
                                        isActive
                                            ? "bg-[rgba(57,184,107,0.14)] font-bold text-brand-active"
                                            : "font-normal text-text-muted hover:bg-bg-soft hover:text-text-primary",
                                    )}
                                >
                  <span
                      aria-hidden="true"
                      className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                          isActive
                              ? "bg-brand text-white"
                              : "bg-transparent text-text-muted",
                      )}
                  >
                    {tab.shortLabel}
                  </span>

                                    <span>{tab.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}