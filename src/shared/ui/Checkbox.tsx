import type {InputHTMLAttributes} from "react";
import {Check} from "lucide-react";
import {cn} from "@/shared/lib";

export interface CheckboxProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
}

export function Checkbox({label, className, id, checked, disabled, ...props}: CheckboxProps) {
    return (
        <label className="inline-flex items-center gap-3 text-sm text-text-primary">
            <span className="relative inline-flex size-5 shrink-0">
                <input
                    id={id}
                    type="checkbox"
                    role="checkbox"
                    aria-checked={checked}
                    checked={checked}
                    disabled={disabled}
                    className="peer absolute inset-0 z-10 size-5 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    {...props}
                />
                <span
                    aria-hidden="true"
                    className={cn(
                        "flex size-5 items-center justify-center rounded-md border-[1.5px] bg-white transition-colors",
                        "border-divider peer-checked:border-brand peer-checked:bg-brand",
                        "peer-focus-visible:ring-[3px] peer-focus-visible:ring-[rgba(57,184,107,0.1)]",
                        "peer-disabled:opacity-50",
                        className,
                    )}
                >
                    <Check
                        className="size-3 text-white"
                        strokeWidth={3}
                    />
                </span>
            </span>

            {label ? <span>{label}</span> : null}
        </label>
    );
}
