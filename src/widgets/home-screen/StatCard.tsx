import type {LucideIcon} from "lucide-react";
import {cn} from "@/shared/lib";

export type StatCardVariant = "neutral" | "savings" | "price-drop" | "potential";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | null;
    change: string;
    variant?: StatCardVariant;
}

const variantStyles: Record<
    StatCardVariant,
    { iconBg: string; iconBorder: string; iconColor: string; valueColor: string }
> = {
    neutral: {
        iconBg: "bg-icon-bg-neutral",
        iconBorder: "border-divider",
        iconColor: "text-text-primary",
        valueColor: "text-text-primary",
    },
    savings: {
        iconBg: "bg-brand/12",
        iconBorder: "border-brand/25",
        iconColor: "text-brand",
        valueColor: "text-brand-active",
    },
    "price-drop": {
        iconBg: "bg-stat-price-drop-bg",
        iconBorder: "border-stat-price-drop-border",
        iconColor: "text-stat-price-drop",
        valueColor: "text-stat-price-drop",
    },
    potential: {
        iconBg: "bg-accent-orange/12",
        iconBorder: "border-accent-orange/25",
        iconColor: "text-accent-orange",
        valueColor: "text-accent-orange",
    },
};

export function StatCard({
                             icon: Icon,
                             label,
                             value,
                             change,
                             variant = "neutral",
                         }: StatCardProps) {
    const s = variantStyles[variant];

    return (
        <div className="bg-white rounded-2xl px-5 py-4.5 border border-divider shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
                <div
                    className={cn(
                        "size-9 rounded-base flex items-center justify-center border",
                        s.iconBg,
                        s.iconBorder,
                    )}
                >
                    <Icon size={16} className={s.iconColor}/>
                </div>
            </div>
            <p
                className={cn(
                    "text-[28px] font-extrabold leading-none mb-1.5 tabular-nums tracking-[-1px]",
                    value !== null ? s.valueColor : "text-divider",
                )}
            >
                {value !== null ? value : "—"}
            </p>
            <p className="text-xs font-semibold text-text-primary mb-0.5">{label}</p>
            <p className="text-[11px] text-text-muted">{change}</p>
        </div>
    );
}
