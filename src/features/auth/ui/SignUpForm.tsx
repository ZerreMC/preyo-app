"use client";

import Link from "next/link";
import {useState, type ComponentProps} from "react";
import {Eye, EyeOff, Lock, Mail, User} from "lucide-react";
import {Button, Input} from "@/shared/ui";

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

export type SignUpInput = {
    displayName: string;
    email: string;
    password: string;
};

type FormErrors = {
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
};

type SignUpFormProps = {
    onSignUp: (input: SignUpInput) => Promise<string | null> | string | null;
    isLoading?: boolean;
    error?: string | null;
};

export function SignUpForm({onSignUp, isLoading = false, error}: SignUpFormProps) {
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit: FormSubmitHandler = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const displayName = String(formData.get("displayName") ?? "").trim();
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        const nextErrors: FormErrors = {};

        if (!displayName) {
            nextErrors.displayName = "Introduce tu nombre visible.";
        }

        if (!email.includes("@")) {
            nextErrors.email = "Introduce un correo válido.";
        }

        if (password.length < 6) {
            nextErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        }

        if (password !== confirmPassword) {
            nextErrors.confirmPassword = "Las contraseñas no coinciden.";
            nextErrors.form = "Confirma que ambas contraseñas coinciden.";
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const serverError = await onSignUp({displayName, email, password});
        if (serverError) {
            setErrors({form: serverError});
        }
    };

    const bannerError = error ?? errors.form;

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
                        Crear cuenta
                    </h1>
                    <p className="text-sm leading-6 text-text-muted">
                        Crea tu cuenta para preparar compras compartidas y comparar precios.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <Input
                    label="Nombre visible"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    placeholder="Tu nombre"
                    leftIcon={User}
                    errorMessage={errors.displayName}
                    required
                />

                <Input
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    leftIcon={Mail}
                    errorMessage={errors.email}
                    required
                />

                <div className="relative">
                    <Input
                        label="Contraseña"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        leftIcon={Lock}
                        errorMessage={errors.password}
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

                <div className="relative">
                    <Input
                        label="Confirmar contraseña"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repite tu contraseña"
                        leftIcon={Lock}
                        errorMessage={errors.confirmPassword}
                        required
                        minLength={6}
                        className="pr-9"
                    />
                    <button
                        type="button"
                        aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute right-4 bottom-3.5 text-text-muted transition hover:text-brand"
                    >
                        {showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
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
                Crear cuenta
            </Button>

            <p className="mt-5 text-center text-sm text-text-muted">
                ¿Ya tienes cuenta?{" "}
                <Link href="/sign-in" className="font-bold text-brand hover:underline">
                    Iniciar sesión
                </Link>
            </p>
        </form>
    );
}
