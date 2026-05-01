import type {ButtonHTMLAttributes, ReactNode} from "react";
import {cn} from "@/shared/lib";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "border-transparent bg-[linear-gradient(135deg,var(--color-brand),var(--color-brand-active))] text-white shadow-[0_8px_24px_rgba(57,184,107,0.28)] hover:brightness-105",
    secondary:
        "border-white/70 bg-white/70 text-[var(--color-text-primary)] shadow-sm backdrop-blur-md hover:bg-white",
    outline:
        "border-black/10 bg-white/60 text-[var(--color-text-primary)] shadow-sm backdrop-blur-md hover:bg-[var(--color-bg-soft)]",
    ghost:
        "border-transparent bg-transparent text-[var(--color-text-muted)] hover:bg-white/60 hover:text-[var(--color-text-primary)]",
    danger:
        "border-transparent bg-[var(--color-error)] text-white shadow-sm hover:brightness-95",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-9 px-3 text-sm",
    md: "min-h-11 px-5 text-sm",
    lg: "min-h-12 px-6 text-base",
};

export function Button({
                           children,
                           variant = "primary",
                           size = "md",
                           fullWidth = false,
                           loading = false,
                           disabled,
                           className,
                           type = "button",
                           ...props
                       }: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-(--color-brand) focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                variantClasses[variant],
                sizeClasses[size],
                fullWidth && "w-full",
                className,
            )}
            {...props}
        >
            {loading ? "Cargando..." : children}
        </button>
    );
}