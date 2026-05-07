import type {ReactNode} from "react";
import {redirect} from "next/navigation";
import {AppShell} from "@/widgets/app-shell/AppShell";
import {createClient} from "@/shared/api/supabase/serverClient";
import {isMockDataSource} from "@/shared/config/env";

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default async function ProtectedLayout({children}: ProtectedLayoutProps) {
    if (isMockDataSource()) {
        return <AppShell>{children}</AppShell>;
    }

    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    return <AppShell>{children}</AppShell>;
}
