import type {ReactNode} from "react";
import {BottomNav} from "@/widgets/bottom-nav/BottomNav";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({children}: AppShellProps) {
    return (
        <div className="min-h-dvh bg-[linear-gradient(135deg,#ECF8EE_0%,#FFF4E8_50%,#ECF8EE_100%)] text-text-primary">
            <div className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col">
                <main className="flex-1 px-4 pb-4 pt-6">
                    {children}
                </main>

                <BottomNav/>
            </div>
        </div>
    );
}