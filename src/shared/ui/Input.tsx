import type {InputHTMLAttributes} from "react";
import {useId} from "react";
import type {LucideIcon} from "lucide-react";
import {cn} from "@/shared/lib";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    status?: "default" | "error";
    leftIcon?: LucideIcon;
    errorMessage?: string;
    error?: string;
}

export function Input({
                          className,
                          error,
                          errorMessage,
                          status = "default",
                          leftIcon: LeftIcon,
                          label,
                          id: externalId,
                          disabled,
                          ...props
                      }: InputProps) {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const resolvedError = errorMessage ?? error;
    const isError = status === "error" || Boolean(resolvedError);
    const errorId = isError && resolvedError ? `${inputId}-error` : undefined;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-primary">
                    {label}
                </label>
            )}

            <div
                className={cn(
                    "flex items-center gap-3 rounded-2xl border-[1.5px] px-4 py-3 transition-[background-color,border-color,box-shadow]",
                    "focus-within:bg-white focus-within:border-brand focus-within:ring-[3px] focus-within:ring-[rgba(57,184,107,0.1)]",
                    isError
                        ? "border-error bg-white ring-[3px] ring-[rgba(201,79,69,0.08)] focus-within:border-error focus-within:ring-[rgba(201,79,69,0.08)]"
                        : "border-divider bg-bg-main",
                    disabled && "opacity-60",
                )}
            >
                {LeftIcon ? (
                    <LeftIcon
                        aria-hidden="true"
                        className={cn("size-4 shrink-0", isError ? "text-error" : "text-text-muted")}
                        strokeWidth={2}
                    />
                ) : null}

                <input
                    id={inputId}
                    disabled={disabled}
                    aria-invalid={isError}
                    aria-describedby={errorId}
                    className={cn(
                        "min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted",
                        "disabled:cursor-not-allowed",
                        className,
                    )}
                    {...props}
                />
            </div>

            {isError && resolvedError ? (
                <p id={errorId} role="alert" className="mt-1 ml-1 text-[11px] text-error">
                    {resolvedError}
                </p>
            ) : null}
        </div>
    );
}
