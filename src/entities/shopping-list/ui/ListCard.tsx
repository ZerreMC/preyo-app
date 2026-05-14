import {Lock} from "lucide-react";
import {AvatarStack, ProgressBar} from "@/shared/ui";
import {cn, formatCurrency, formatRelativeTime} from "@/shared/lib";

export type ListCardCollaborator = {
    id: string;
    name?: string;
    initials: string;
    color: string;
};

export type ListCardData = {
    id: string;
    title: string;
    categoryEmoji: string;
    status?: string;
    itemCount: number;
    checkedCount?: number;
    totalPrice?: number | null;
    estimatedSavings?: number | null;
    progressPct: number;
    collaborators: ListCardCollaborator[];
    isLocked?: boolean;
    updatedAt?: string;
};

export type ListCardProps = {
    list: ListCardData;
    variant?: "grid" | "row";
    className?: string;
};

const statusBadge: Record<string, { label: string; className: string }> = {
    draft: {label: "Borrador", className: "bg-[#F5F3EE] text-[#8D948E]"},
    active: {label: "Activa", className: "bg-[#ECF8EE] text-[#217A4B]"},
    shopping: {label: "En compra", className: "bg-[#EDF0FF] text-[#4557DB]"},
    completed: {label: "Completada", className: "bg-[#E3F2FD] text-[#1565C0]"},
    archived: {label: "Archivada", className: "bg-[#F5F3EE] text-[#8D948E]"},
};

function PriceDisplay({value}: { value?: number | null }) {
    if (value == null) return <span>—</span>;
    return <span>{formatCurrency(value)}</span>;
}

export function ListCard({list, variant = "grid", className}: ListCardProps) {
    const clampedProgress = Math.max(0, Math.min(100, list.progressPct));
    const badge = list.status ? statusBadge[list.status] : null;
    const checkedCount = list.checkedCount ?? 0;
    const remaining = list.itemCount > 0 ? list.itemCount - checkedCount : null;
    const relativeTime = list.updatedAt ? formatRelativeTime(list.updatedAt) : null;

    if (variant === "row") {
        return (
            <article
                className={cn(
                    "flex items-center gap-3 border-b border-divider px-4 py-3 transition-colors hover:bg-bg-hover",
                    className,
                )}
            >
                {/* Lista */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="text-lg">{list.categoryEmoji}</span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate text-[14px] font-semibold text-text-primary">
                                {list.title}
                            </span>
                            {list.isLocked ? <Lock size={11} className="shrink-0 text-text-muted"/> : null}
                        </div>
                        <span className="text-[11px] text-text-muted">{list.itemCount} productos</span>
                    </div>
                </div>

                {/* Estado */}
                <div className="w-24 shrink-0">
                    {badge ? (
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.className)}>
                            {badge.label}
                        </span>
                    ) : null}
                </div>

                {/* Total */}
                <div className="w-20 shrink-0 text-right text-[13px] text-text-muted">
                    <PriceDisplay value={list.totalPrice}/>
                </div>

                {/* Ahorro */}
                <div className="w-20 shrink-0 text-right text-[13px] text-text-muted">
                    <PriceDisplay value={list.estimatedSavings}/>
                </div>

                {/* Actualizada */}
                <div className="w-28 shrink-0 text-right text-[12px] text-text-muted">
                    {relativeTime ?? "—"}
                </div>
            </article>
        );
    }

    // Grid variant (default)
    return (
        <article
            className={cn(
                "flex flex-col rounded-3xl border border-divider bg-white p-4",
                className,
            )}
        >
            {/* Top: emoji + badge */}
            <div className="mb-3 flex items-center justify-between gap-2">
                <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(57,184,107,0.14)] text-2xl">
                    {list.categoryEmoji}
                </div>
                {badge ? (
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", badge.className)}>
                        {badge.label}
                    </span>
                ) : null}
            </div>

            {/* Título + lock */}
            <div className="mb-0.5 flex items-center gap-1.5">
                <h3 className="truncate text-[15px] font-bold text-text-primary">{list.title}</h3>
                {list.isLocked ? <Lock size={12} className="shrink-0 text-text-muted"/> : null}
            </div>
            <p className="mb-3 text-[12px] text-text-muted">{list.itemCount} productos</p>

            {/* Barra de progreso */}
            <ProgressBar
                value={list.checkedCount !== undefined ? checkedCount : clampedProgress}
                max={list.checkedCount !== undefined ? (list.itemCount || 100) : 100}
                className="mb-1 h-1.5"
            />
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                    {remaining !== null
                        ? remaining > 0
                            ? `${remaining} por comprar`
                            : "Todo listo"
                        : ""}
                </span>
                <span className="text-[11px] font-semibold text-brand">
                    {Math.round(clampedProgress)}%
                </span>
            </div>

            {/* Footer: avatares · precio · tiempo */}
            <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                <AvatarStack avatars={list.collaborators} size="sm" max={3}/>
                <div className="ml-auto flex items-center gap-1.5">
                    <PriceDisplay value={list.totalPrice}/>
                    {relativeTime ? (
                        <>
                            <span>·</span>
                            <span>{relativeTime}</span>
                        </>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
