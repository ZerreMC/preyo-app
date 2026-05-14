import {redirect} from "next/navigation";
import {SignUpForm} from "@/features/auth";
import type {SignUpInput, SignUpResult} from "@/features/auth";
import {createClient} from "@/shared/api/supabase/serverClient";

type SignUpPageProps = {
    searchParams?: Promise<{
        redirectTo?: string;
        redirect?: string;
    }>;
};

function safeRedirectPath(value: string | undefined) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/";
    }

    return value;
}

export default async function SignUpPage({searchParams}: SignUpPageProps) {
    const params = await searchParams;
    const redirectTo = safeRedirectPath(params?.redirectTo ?? params?.redirect);

    async function handleSignUp(input: SignUpInput): Promise<SignUpResult> {
        "use server";

        const supabase = await createClient();

        const {data, error} = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
                data: {
                    display_name: input.displayName,
                },
            },
        });

        if (error) {
            return {error: error.message || "Ocurrió un error al registrar la cuenta."};
        }

        if (!data.session) {
            return {message: "Cuenta creada. Revisa tu correo para confirmar el registro."};
        }

        redirect(redirectTo);
    }

    return (
        <main
            className="relative grid min-h-dvh place-items-center overflow-hidden bg-[linear-gradient(160deg,#ECF8EE_0%,#FFFDF8_58%,#FFF4E8_100%)] px-5 py-10">
            <div
                className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-[rgba(57,184,107,0.18)] blur-3xl"/>
            <div
                className="pointer-events-none absolute bottom-10 -left-20 size-52 rounded-full bg-[rgba(255,138,61,0.14)] blur-3xl"/>
            <div className="relative z-10 w-full">
                <SignUpForm onSignUp={handleSignUp}/>
            </div>
        </main>
    );
}
