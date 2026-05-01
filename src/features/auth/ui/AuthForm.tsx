"use client";

import type {ComponentProps} from "react";
import {Button, Input} from "@/shared/ui";
import {useAuthAction, type AuthMode} from "../model/hooks/useAuthAction";

interface AuthFormProps {
    mode: AuthMode;
}

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

export function AuthForm({mode}: AuthFormProps) {
    const {execute, error, message, isPending} = useAuthAction(mode);

    const title = mode === "sign-in" ? "Iniciar sesión" : "Crear cuenta";
    const buttonText = mode === "sign-in" ? "Entrar" : "Registrarme";

    const handleSubmit: FormSubmitHandler = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        await execute({
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="glass-strong space-y-5 rounded-3xl p-6"
        >
            <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tight">{title}</h1>
                <p className="text-sm text-(--color-text-muted)">
                    Accede a Preyo para gestionar tus listas y comparar precios.
                </p>
            </div>

            <div className="space-y-3">
                <Input
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                />

                <Input
                    label="Contraseña"
                    name="password"
                    type="password"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                />
            </div>

            {error ? (
                <p role="alert" className="text-sm text-(--color-error)">
                    {error}
                </p>
            ) : null}

            {message ? (
                <p role="status" className="text-sm text-(--color-brand-active)">
                    {message}
                </p>
            ) : null}

            <Button type="submit" fullWidth size="lg" loading={isPending}>
                {buttonText}
            </Button>
        </form>
    );
}