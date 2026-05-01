import Link from "next/link";
import {AuthForm} from "@/features/auth";

export default function SignUpPage() {
    return (
        <main
            className="flex min-h-dvh items-center justify-center bg-[linear-gradient(135deg,#ECF8EE_0%,#FFF4E8_50%,#ECF8EE_100%)] px-4">
            <div className="w-full max-w-md space-y-4">
                <AuthForm mode="sign-up"/>

                <p className="text-center text-sm text-(--color-text-muted)">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/sign-in" className="font-semibold text-(--color-brand-active)">
                        Iniciar sesión
                    </Link>
                </p>
            </div>
        </main>
    );
}