"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/shared/api/supabase/browserClient";

export type AuthMode = "sign-in" | "sign-up";

interface AuthPayload {
    email: string;
    password: string;
    displayName?: string;
}

export function useAuthAction(mode: AuthMode) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function execute({email, password, displayName}: AuthPayload) {
        setError(null);
        setMessage(null);
        setIsPending(true);

        try {
            const supabase = createClient();

            const result =
                mode === "sign-in"
                    ? await supabase.auth.signInWithPassword({email, password})
                    : await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo: `${window.location.origin}/auth/callback`,
                            data: {
                                display_name: displayName,
                            },
                        },
                    });

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
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ocurrió un error inesperado");
        } finally {
            setIsPending(false);
        }
    }

    return {
        execute,
        error,
        message,
        isPending,
    };
}