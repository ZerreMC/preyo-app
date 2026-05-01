import type {ComponentProps} from "react";
import {cn} from "@/shared/lib";

type CardVariant = "default" | "flat" | "glass";

interface CardProps extends ComponentProps<"section"> {
    variant?: CardVariant;
}

const cardVariants: Record<CardVariant, string> = {
    default: "border border-black/5 bg-white shadow-sm",
    flat: "border border-black/5 bg-[var(--color-bg-soft)]",
    glass:
        "border border-[var(--glass-strong-border)] bg-[var(--glass-strong-bg)] shadow-sm backdrop-blur-md",
};

export function Card({
                         className,
                         variant = "default",
                         ...props
                     }: CardProps) {
    return (
        <section
            className={cn(
                "flex flex-col gap-5 rounded-3xl",
                cardVariants[variant],
                className,
            )}
            {...props}
        />
    );
}

export function CardHeader({
                               className,
                               ...props
                           }: ComponentProps<"div">) {
    return (
        <div
            className={cn("flex flex-col gap-1.5 px-5 pt-5", className)}
            {...props}
        />
    );
}

export function CardTitle({
                              className,
                              ...props
                          }: ComponentProps<"h3">) {
    return (
        <h3
            className={cn(
                "text-base font-semibold leading-tight text-(--color-text-primary)",
                className,
            )}
            {...props}
        />
    );
}

export function CardDescription({
                                    className,
                                    ...props
                                }: ComponentProps<"p">) {
    return (
        <p
            className={cn(
                "text-sm leading-relaxed text-(--color-text-muted)",
                className,
            )}
            {...props}
        />
    );
}

export function CardAction({
                               className,
                               ...props
                           }: ComponentProps<"div">) {
    return (
        <div
            className={cn("flex items-center justify-end", className)}
            {...props}
        />
    );
}

export function CardContent({
                                className,
                                ...props
                            }: ComponentProps<"div">) {
    return (
        <div
            className={cn("px-5 last:pb-5", className)}
            {...props}
        />
    );
}

export function CardFooter({
                               className,
                               ...props
                           }: ComponentProps<"div">) {
    return (
        <div
            className={cn("flex items-center gap-3 px-5 pb-5", className)}
            {...props}
        />
    );
}