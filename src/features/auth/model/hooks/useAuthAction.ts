"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/shared/api/supabase/browserClient";

export type AuthMode = "sign-in" | "sign-up";

interface AuthPayload {
    email: string;
    password: string;
}

export function useAuthAction(mode: AuthMode) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function execute({email, password}: AuthPayload) {
        setError(null);
        setMessage(null);
        setIsPending(true);

        const supabase = createClient();

        const result =
            mode === "sign-in"
                ? await supabase.auth.signInWithPassword({email, password})
                : await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

        setIsPending(false);

        if (result.error) {
            setError(result.error.message);
            return;
        }

        if (mode === "sign-up" && !result.data.session) {
            setMessage("Cuenta creada. Revisa tu correo para confirmar el registro.");
            return;
        }

        router.replace("/lists");
        router.refresh();
    }

    return {execute, error, message, isPending};
}