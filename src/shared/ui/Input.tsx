import type {InputHTMLAttributes} from "react";
import {useId} from "react";
import {cn} from "@/shared/lib";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({className, error, label, id: externalId, ...props}: InputProps) {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-(--color-text-primary)">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
                className={cn(
                    "min-h-11 w-full rounded-xl border bg-white px-4 text-sm transition",
                    "border-black/10 text-(--color-text-primary) placeholder:text-(--color-text-muted)",
                    "focus:border-(--color-brand) focus:outline-none focus:ring-[3px] focus:ring-[rgba(57,184,107,0.25)]",
                    "disabled:cursor-not-allowed disabled:bg-black/5 disabled:opacity-60",
                    error && "border-(--color-error) focus:border-(--color-error)",
                    className,
                )}
                {...props}
            />
            {error ? (
                <p id={errorId} role="alert" className="text-xs text-(--color-error)">
                    {error}
                </p>
            ) : null}
        </div>
    );
}