"use client";

import * as React from "react";
import {motion} from "motion/react";
import {cn} from "@/shared/lib";

export type ToggleProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "role" | "aria-checked"
> & {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

export function Toggle({
                           checked,
                           defaultChecked = false,
                           onCheckedChange,
                           className,
                           disabled,
                           onClick,
                           type = "button",
                           ...props
                       }: ToggleProps) {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const setChecked = (nextChecked: boolean) => {
        if (!isControlled) {
            setInternalChecked(nextChecked);
        }
        onCheckedChange?.(nextChecked);
    };

    return (
        <button
            {...props}
            type={type}
            role="switch"
            aria-checked={isChecked}
            disabled={disabled}
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                    setChecked(!isChecked);
                }
            }}
            className={cn(
                "relative h-6 w-12 rounded-full outline-none transition-colors",
                "focus-visible:ring-[3px] focus-visible:ring-[rgba(57,184,107,0.1)]",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isChecked ? "bg-brand" : "bg-divider",
                className,
            )}
        >
            <motion.span
                aria-hidden="true"
                animate={{x: isChecked ? 24 : 2}}
                transition={{type: "spring", stiffness: 400, damping: 28}}
                className="absolute top-0.5 block size-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
            />
        </button>
    );
}
