"use client";

import Link from "next/link";
import {useState, type ComponentProps} from "react";
import {Eye, EyeOff, Lock, Mail} from "lucide-react";
import {Button, Input} from "@/shared/ui";

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

export type SignInInput = {
    email: string;
    password: string;
};

type SignInFormProps = {
    error?: string | null;
    isLoading?: boolean;
    onSignIn: (input: SignInInput) => Promise<string | null> | string | null;
};

export function SignInForm({onSignIn, isLoading = false, error}: SignInFormProps) {
    const [internalError, setInternalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit: FormSubmitHandler = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        if (!email.includes("@") || password.length < 6) {
            setInternalError("Revisa el correo y la contraseña antes de continuar.");
            return;
        }

        setInternalError(null);
        const serverError = await onSignIn({email, password});
        if (serverError) {
            setInternalError(serverError);
            return;
        }
    };

    const bannerError = error ?? internalError;

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className="mx-auto w-full max-w-sm rounded-3xl border border-white/70 bg-[rgba(255,255,255,0.78)] p-7 shadow-[0_2px_10px_rgba(0,0,0,0.04)] backdrop-blur-xl"
        >
            <div className="mb-7 space-y-5">
                <div
                    className="flex size-12 items-center justify-center rounded-2xl bg-bg-soft text-2xl font-black text-brand-active shadow-sm">
                    P
                </div>

                <div className="space-y-1.5">
                    <h1 className="text-2xl font-black tracking-normal text-text-primary">
                        Iniciar sesión
                    </h1>
                    <p className="text-sm leading-6 text-text-muted">
                        Accede a Preyo para gestionar tus listas y comparar precios.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <Input
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    leftIcon={Mail}
                    required
                />

                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            label="Contraseña"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Mínimo 6 caracteres"
                            leftIcon={Lock}
                            required
                            minLength={6}
                            className="pr-9"
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-4 bottom-3.5 text-text-muted transition hover:text-brand"
                        >
                            {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </div>
            </div>

            {bannerError ? (
                <div
                    role="alert"
                    className="mt-5 rounded-2xl border border-[#FFD6D6] bg-[#FFF0F0] px-4 py-3 text-sm font-medium text-error"
                >
                    {bannerError}
                </div>
            ) : null}

            <Button type="submit" fullWidth size="lg" loading={isLoading} className="mt-6">
                Entrar
            </Button>

            <p className="mt-5 text-center text-sm text-text-muted">
                ¿No tienes cuenta?{" "}
                <Link href="/sign-up" className="font-bold text-brand hover:underline">
                    Crear cuenta
                </Link>
            </p>
        </form>
    );
}
