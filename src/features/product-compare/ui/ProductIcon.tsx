import {Coffee, Droplets, Milk, PackageCheck, Wheat} from "lucide-react";
import {cn} from "@/shared/lib";
import type {ComparableProduct} from "../model/types";

type ProductIconProps = {
    icon: ComparableProduct["icon"];
    className?: string;
};

const iconMap = {
    oil: Droplets,
    milk: Milk,
    rice: Wheat,
    yogurt: PackageCheck,
    coffee: Coffee,
} as const;

export function ProductIcon({icon, className}: ProductIconProps) {
    const Icon = iconMap[icon];

    return (
        <div
            className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl border border-divider bg-bg-soft text-brand-active shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
                className,
            )}
        >
            <Icon size={22} strokeWidth={2.1}/>
        </div>
    );
}
