import {redirect} from "next/navigation";
import {SignUpForm} from "@/features/auth";
import type {SignUpInput} from "@/features/auth";
import {createClient} from "@/shared/api/supabase/serverClient";

export default function SignUpPage() {
    async function handleSignUp(input: SignUpInput): Promise<string | null> {
        "use server";

        const supabase = await createClient();

        const {error} = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
                data: {
                    display_name: input.displayName,
                },
            },
        });

        if (error) {
            return error.message || "Ocurrió un error al registrar la cuenta.";
        }

        // According to SSR auth, successful sign up signs in the user directly or sends an email. 
        // We'll redirect to the home page if it succeeds.
        redirect("/");
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
