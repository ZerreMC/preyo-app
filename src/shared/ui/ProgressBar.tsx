"use client";

import * as React from "react";
import {motion, useReducedMotion} from "motion/react";
import {cn} from "@/shared/lib";

export type ProgressBarProps = React.HTMLAttributes<HTMLDivElement> & {
    value: number;
    max?: number;
    indicatorClassName?: string;
};

export function ProgressBar({
                                value,
                                max = 100,
                                className,
                                indicatorClassName,
                                ...props
                            }: ProgressBarProps) {
    const pct = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
    const prefersReduced = useReducedMotion();

    return (
        <div
            {...props}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={value}
            className={cn("h-2 overflow-hidden rounded-full bg-divider", className)}
        >
            <motion.div
                initial={{width: prefersReduced ? `${pct}%` : 0}}
                animate={{width: `${pct}%`}}
                transition={prefersReduced ? {duration: 0} : {delay: 0.3, duration: 0.8, ease: "easeOut"}}
                className={cn(
                    "h-full rounded-full bg-linear-to-r from-[#7EC87A] to-brand-active",
                    indicatorClassName,
                )}
            />
        </div>
    );
}
