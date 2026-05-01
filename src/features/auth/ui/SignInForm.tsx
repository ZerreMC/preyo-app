"use client";

import Link from "next/link";
import {useState, type ComponentProps} from "react";
import {motion} from "motion/react";
import {Mail, Lock, Eye, EyeOff} from "lucide-react";
import {Button, Input} from "@/shared/ui";
import {useAuthAction} from "../model/hooks/useAuthAction";

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

export function SignInForm() {
    const {execute, error, message, isPending} = useAuthAction("sign-in");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit: FormSubmitHandler = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        await execute({
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
        });
    };

    return (
        <motion.form
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4, ease: "easeOut"}}
            onSubmit={handleSubmit}
            className="glass-strong space-y-5 rounded-3xl p-6"
        >
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-text-primary">
                    Iniciar sesión
                </h1>
                <p className="text-sm leading-6 text-text-muted">
                    Accede a Preyo para gestionar tus listas y comparar precios.
                </p>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Input
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="tu@email.com"
                        required
                        className="pl-11"
                    />
                    <Mail className="absolute bottom-3 left-4 size-5 text-text-muted"/>
                </div>

                <div className="relative">
                    <Input
                        label="Contraseña"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="pl-11 pr-11"
                    />
                    <Lock className="absolute bottom-3 left-4 size-5 text-text-muted"/>
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute bottom-3 right-4 text-text-muted hover:text-brand"
                    >
                        {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                </div>
            </div>

            {error ? (
                <p role="alert" className="text-sm font-medium text-error">
                    {error}
                </p>
            ) : null}

            {message ? (
                <p role="status" className="text-sm font-medium text-brand">
                    {message}
                </p>
            ) : null}

            <Button type="submit" fullWidth size="lg" loading={isPending}>
                Entrar
            </Button>

            <p className="text-center text-sm text-text-muted">
                ¿No tienes cuenta?{" "}
                <Link href="/sign-up" className="font-bold text-brand hover:underline">
                    Crear cuenta
                </Link>
            </p>
        </motion.form>
    );
}
