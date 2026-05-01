"use client";

import Link from "next/link";
import {useState, type ComponentProps} from "react";
import {motion} from "motion/react";
import {User, Mail, Lock, Eye, EyeOff} from "lucide-react";
import {Button, Checkbox, Input} from "@/shared/ui";
import {useAuthAction} from "../model/hooks/useAuthAction";

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

interface FormErrors {
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    privacy?: string;
}

function getPasswordStrength(password: string) {
    if (password.length === 0) {
        return {label: "", width: "0%", color: "transparent"};
    }

    if (password.length < 6) {
        return {label: "Débil", width: "33%", color: "var(--color-error)"};
    }

    if (password.length < 10) {
        return {
            label: "Media",
            width: "66%",
            color: "var(--color-accent-highlight)",
        };
    }

    return {label: "Fuerte", width: "100%", color: "var(--color-brand)"};
}

export function SignUpForm() {
    const {execute, error, message, isPending} = useAuthAction("sign-up");

    const [password, setPassword] = useState("");
    const [privacy, setPrivacy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const strength = getPasswordStrength(password);

    const handleSubmit: FormSubmitHandler = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const displayName = String(formData.get("displayName") ?? "").trim();
        const email = String(formData.get("email") ?? "").trim();
        const currentPassword = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        const nextErrors: FormErrors = {};

        if (!displayName) {
            nextErrors.displayName = "Introduce tu nombre visible";
        }

        if (!email.includes("@")) {
            nextErrors.email = "Correo no válido";
        }

        if (currentPassword.length < 6) {
            nextErrors.password = "Mínimo 6 caracteres";
        }

        if (currentPassword !== confirmPassword) {
            nextErrors.confirmPassword = "Las contraseñas no coinciden";
        }

        if (!privacy) {
            nextErrors.privacy = "Debes aceptar la política de privacidad";
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        await execute({
            displayName,
            email,
            password: currentPassword,
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
                    Crea tu cuenta
                </h1>
                <p className="text-sm leading-6 text-text-muted">
                    Únete a Preyo y empieza a ahorrar en tus compras.
                </p>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Input
                        label="Nombre visible"
                        name="displayName"
                        type="text"
                        autoComplete="name"
                        placeholder="Tu nombre"
                        error={errors.displayName}
                        required
                        className="pl-11"
                    />
                    <User className="absolute bottom-3 left-4 size-5 text-text-muted"/>
                </div>

                <div className="relative">
                    <Input
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="tu@email.com"
                        error={errors.email}
                        required
                        className="pl-11"
                    />
                    <Mail className="absolute bottom-3 left-4 size-5 text-text-muted"/>
                </div>

                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            label="Contraseña"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            error={errors.password}
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

                    {password.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{width: strength.width, backgroundColor: strength.color}}
                                />
                            </div>
                            <span className="text-[10px] font-bold" style={{color: strength.color}}>
                                {strength.label}
                            </span>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <Input
                        label="Confirmar contraseña"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repite tu contraseña"
                        error={errors.confirmPassword}
                        required
                        minLength={6}
                        className="pl-11 pr-11"
                    />
                    <Lock className="absolute bottom-3 left-4 size-5 text-text-muted"/>
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute bottom-3 right-4 text-text-muted hover:text-brand"
                    >
                        {showConfirmPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="privacy"
                        checked={privacy}
                        onChange={(event) => setPrivacy(event.target.checked)}
                        className="mt-0.5"
                    />
                    <label htmlFor="privacy" className="text-[13px] leading-snug text-text-muted">
                        Acepto la <span className="font-semibold text-brand">política de privacidad</span> y los <span
                        className="font-semibold text-brand">términos de uso</span> de Preyo
                    </label>
                </div>

                {errors.privacy && (
                    <p className="pl-8 text-xs text-error">
                        {errors.privacy}
                    </p>
                )}
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
                Crear cuenta
            </Button>

            <p className="text-center text-sm text-text-muted">
                ¿Ya tienes cuenta?{" "}
                <Link href="/sign-in" className="font-bold text-brand hover:underline">
                    Iniciar sesión
                </Link>
            </p>
        </motion.form>
    );
}