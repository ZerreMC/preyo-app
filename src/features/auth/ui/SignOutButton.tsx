"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/shared/ui";
import {createClient} from "@/shared/api/supabase/browserClient";

export function SignOutButton() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSignOut() {
        setIsPending(true);
        setError(null);

        const supabase = createClient();
        const {error} = await supabase.auth.signOut();

        setIsPending(false);

        if (error) {
            setError(error.message);
            return;
        }

        router.replace("/sign-in");
        router.refresh();
    }

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="danger"
                fullWidth
                loading={isPending}
                onClick={handleSignOut}
            >
                Cerrar sesión
            </Button>

            {error ? (
                <p role="alert" className="text-sm text-error">
                    {error}
                </p>
            ) : null}
        </div>
    );
}