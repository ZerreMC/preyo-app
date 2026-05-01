import type {ReactNode} from "react";
import {BottomNav} from "@/widgets/bottom-nav/BottomNav";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({children}: AppShellProps) {
    return (
        <div className="relative flex min-h-dvh w-full flex-col bg-(--color-bg-main) font-sans">
            {/* Decoraciones opcionales */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div
                    className="absolute -right-24 -top-24 size-80 rounded-full bg-[rgba(57,184,107,0.18)] opacity-50 blur-3xl"/>
                <div
                    className="absolute -left-24 top-1/3 size-72 rounded-full bg-[rgba(255,138,61,0.16)] opacity-40 blur-3xl"/>
            </div>

            <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-28 pt-6">
                {children}
            </main>

            <BottomNav/>
        </div>
    );
}