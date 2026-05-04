import {redirect} from "next/navigation";
import {SignInForm, type SignInInput} from "@/features/auth";
import {createClient} from "@/shared/api/supabase/serverClient";

export default function SignInPage() {
    async function handleSignIn(input: SignInInput): Promise<string | null> {
        "use server";

        const supabase = await createClient(); // si createClient NO es async, quita el await

        const {error} = await supabase.auth.signInWithPassword({
            email: input.email,
            password: input.password,
        });

        if (error) return "Correo o contraseña incorrectos.";

        redirect("/");
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