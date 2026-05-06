import type {ReactNode} from "react";
import {redirect} from "next/navigation";
import {AppShell} from "@/widgets/app-shell/AppShell";
import {createClient} from "@/shared/api/supabase/serverClient";

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default async function ProtectedLayout({children}: ProtectedLayoutProps) {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    const isMock = process.env.NEXT_PUBLIC_PREYO_DATA_SOURCE === "mock";

    if (!user && !isMock) {
        redirect("/sign-in");
    }

    return <AppShell>{children}</AppShell>;
}