import type {ReactNode} from "react";
import {BottomNav} from "@/widgets/bottom-nav/BottomNav";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({children}: AppShellProps) {
    return (
        <div
            className="min-h-dvh bg-[linear-gradient(135deg,#ECF8EE_0%,#FFF4E8_50%,#ECF8EE_100%)] text-text-primary">
            <main className="mx-auto min-h-dvh w-full max-w-107.5 px-4 pb-28 pt-6 md:max-w-5xl md:px-8">
                {children}
            </main>

            <BottomNav/>
        </div>
    );
}