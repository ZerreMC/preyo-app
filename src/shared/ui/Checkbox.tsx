import type {InputHTMLAttributes} from "react";
import {cn} from "@/shared/lib";

interface CheckboxProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
}

export function Checkbox({label, className, id, ...props}: CheckboxProps) {
    return (
        <label className="inline-flex items-center gap-3 text-sm text-(--color-text-primary)">
            <input
                id={id}
                type="checkbox"
                className={cn(
                    "size-5 shrink-0 rounded-md border border-black/20 accent-(--color-brand) transition",
                    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(57,184,107,0.35)] focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
                {...props}
            />

            {label ? <span>{label}</span> : null}
        </label>
    );
}