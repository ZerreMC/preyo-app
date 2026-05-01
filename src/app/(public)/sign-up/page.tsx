import Link from "next/link";
import {AuthForm} from "@/features/auth";

export default function SignUpPage() {
    return (
        <main
            className="min-h-dvh bg-[linear-gradient(135deg,#ECF8EE_0%,#FFF4E8_50%,#ECF8EE_100%)] px-4 py-6 text-text-primary">
            <div className="mx-auto w-full max-w-107.5 space-y-8 md:max-w-3xl">
                <header className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/sign-in"
                            className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm"
                            aria-label="Volver"
                        >
                            ←
                        </Link>

                        <div className="flex items-center gap-2">
              <span
                  className="flex size-8 items-center justify-center rounded-lg bg-brand font-bold text-white">
                P
              </span>
                            <span className="font-black">preyo</span>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Crea tu cuenta</h1>
                        <p className="mt-2 text-sm text-text-muted">
                            Únete a Preyo para organizar tus compras y comparar precios.
                        </p>
                    </div>
                </header>

                <AuthForm mode="sign-up"/>

                <p className="text-center text-sm text-text-muted">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/sign-in" className="font-semibold text-brand">
                        Iniciar sesión
                    </Link>
                </p>
            </div>
        </main>
    );
}