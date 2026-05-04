"use client";

import * as React from "react";
import {cn} from "@/shared/lib";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    disabled?: boolean;
};

function Spinner({className}: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "inline-block size-4 animate-spin rounded-full border-2 border-current border-b-transparent",
                className,
            )}
        />
    );
}

export function Button({
                           children,
                           variant = "primary",
                           size = "md",
                           fullWidth = false,
                           loading = false,
                           leftIcon,
                           rightIcon,
                           disabled = false,
                           className,
                           type = "button",
                           ...props
                       }: ButtonProps) {
    const isDisabled = disabled || loading;

    const base =
        "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none " +
        "rounded-3xl font-semibold transition " +
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand focus-visible:ring-offset-2 " +
        "disabled:pointer-events-none disabled:opacity-60";

    const sizes: Record<ButtonSize, string> = {
        sm: "min-h-9 px-3 text-sm",
        md: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-5 text-base",
    };

    const variants: Record<ButtonVariant, string> = {
        primary:
            "text-white shadow-sm shadow-[rgba(57,184,107,0.35)] " +
            "bg-linear-to-b from-brand to-brand-active hover:brightness-[1.02] active:brightness-[0.98]",
        secondary:
            "bg-[rgba(57,184,107,0.14)] text-brand-active hover:bg-[rgba(57,184,107,0.18)] active:bg-[rgba(57,184,107,0.22)]",
        outline:
            "border-[1.5px] border-divider bg-white/70 text-text-primary shadow-sm backdrop-blur-md hover:bg-bg-soft active:bg-bg-soft",
        ghost:
            "bg-transparent text-brand border-[1.5px] border-brand hover:bg-[rgba(57,184,107,0.08)] active:bg-[rgba(57,184,107,0.12)]",
        danger:
            "bg-[#FFF0F0] text-error border border-[#FFD6D6] hover:bg-[#FFE6E6] active:bg-[#FFDDDD]",
    };

    return (
        <button
            {...props}
            type={type}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            className={cn(base, sizes[size], variants[variant], fullWidth && "w-full", className)}
        >
            {loading ? (
                <>
                    <Spinner className="opacity-90"/>
                    <span className="sr-only">Cargando</span>
                </>
            ) : null}

            {!loading && leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}

            {/* Mantiene layout estable en loading */}
            <span className={cn(loading ? "sr-only" : undefined)}>{children}</span>

            {!loading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
        </button>
    );
}
