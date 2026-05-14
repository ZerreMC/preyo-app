"use client";

import * as React from "react";
import {motion, useReducedMotion} from "motion/react";
import {Minus, Plus} from "lucide-react";
import {cn} from "@/shared/lib";

export type QuantityStepperProps = {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    size?: "sm" | "md";
    className?: string;
};

export function QuantityStepper({
                                    value,
                                    onChange,
                                    min = 1,
                                    max = 99,
                                    size = "md",
                                    className,
                                }: QuantityStepperProps) {
    const prefersReduced = useReducedMotion();
    const canDecrement = value > min;
    const canIncrement = value < max;

    const tapScale = prefersReduced ? 1 : 0.9;

    const btnSize = size === "sm" ? "size-5" : "size-6";
    const iconSize = size === "sm" ? 10 : 12;
    const textSize = size === "sm" ? "text-[12px]" : "text-[13px]";
    const minWidth = size === "sm" ? "min-w-[72px]" : "min-w-[84px]";

    return (
        <div
            className={cn(
                "flex items-center justify-between rounded-xl border border-brand bg-feedback-success-bg px-1.5 py-1",
                minWidth,
                className,
            )}
        >
            <motion.button
                type="button"
                whileTap={{scale: tapScale}}
                aria-label="Reducir cantidad"
                aria-disabled={!canDecrement}
                onClick={() => canDecrement && onChange(value - 1)}
                className={cn(
                    btnSize,
                    "flex shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-opacity",
                    !canDecrement && "opacity-40",
                )}
            >
                <Minus size={iconSize} className="text-brand" strokeWidth={2.5}/>
            </motion.button>

            <span className={cn("select-none font-semibold text-brand", textSize)}>
                {value}
            </span>

            <motion.button
                type="button"
                whileTap={{scale: tapScale}}
                aria-label="Aumentar cantidad"
                aria-disabled={!canIncrement}
                onClick={() => canIncrement && onChange(value + 1)}
                className={cn(
                    btnSize,
                    "flex shrink-0 items-center justify-center rounded-lg bg-brand shadow-sm transition-opacity",
                    !canIncrement && "opacity-40",
                )}
            >
                <Plus size={iconSize} className="text-white" strokeWidth={2.5}/>
            </motion.button>
        </div>
    );
}
