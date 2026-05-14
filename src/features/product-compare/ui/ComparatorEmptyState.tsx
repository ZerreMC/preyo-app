import {Search} from "lucide-react";
import {cn} from "@/shared/lib";

type ComparatorEmptyStateProps = {
    title: string;
    description?: string;
    compact?: boolean;
};

export function ComparatorEmptyState({title, description, compact = false}: ComparatorEmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-3xl border border-dashed border-divider bg-white text-center",
                compact ? "px-5 py-8" : "min-h-90 px-6 py-12 shadow-[0_10px_34px_rgba(31,42,36,0.06)]",
            )}
        >
            <div className="mb-4 grid size-13 place-items-center rounded-3xl bg-bg-soft text-brand-active">
                <Search size={22}/>
            </div>
            <p className="max-w-sm text-base font-black text-text-primary">{title}</p>
            {description ? (
                <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{description}</p>
            ) : null}
        </div>
    );
}
