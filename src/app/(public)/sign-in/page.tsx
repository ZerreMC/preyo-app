import {redirect} from "next/navigation";
import {SignInForm, type SignInInput} from "@/features/auth";
import {createClient} from "@/shared/api/supabase/serverClient";

type SignInPageProps = {
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

export default async function SignInPage({searchParams}: SignInPageProps) {
    const params = await searchParams;
    const redirectTo = safeRedirectPath(params?.redirectTo ?? params?.redirect);

    async function handleSignIn(input: SignInInput): Promise<string | null> {
        "use server";

        const supabase = await createClient();

        const {error} = await supabase.auth.signInWithPassword({
            email: input.email,
            password: input.password,
        });

        if (error) return "Correo o contraseña incorrectos.";

        redirect(redirectTo);
    }

    return (
        <main
            className="relative grid min-h-dvh place-items-center overflow-hidden bg-[linear-gradient(160deg,#ECF8EE_0%,#FFFDF8_58%,#FFF4E8_100%)] px-5 py-10">
            {/* ... */}
            <div className="relative z-10 w-full">
                <SignInForm onSignIn={handleSignIn}/>
            </div>
        </main>
    );
}
