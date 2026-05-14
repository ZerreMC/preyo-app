import {Clock, Lock} from "lucide-react";
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
    status?: string;            // string — avoids intersection never with MockListSummary
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
    draft: {label: "Borrador", className: "bg-[#FFF8E1] text-[#E65100] border border-[#FFE082]"},
    active: {label: "Activa", className: "bg-[#E8F5E6] text-[#2E7D32] border border-[#C8E6C9]"},
    shopping: {label: "En compra", className: "bg-[#EDF0FF] text-[#4557DB] border border-[#C5CAF0]"},
    completed: {label: "Completada", className: "bg-[#F5F5F5] text-[#8E8E93] border border-[#E8E4DC]"},
    archived: {label: "Archivada", className: "bg-[#F5F3EE] text-[#8D948E] border border-divider"},
};

export function ListCard({list, variant = "grid", className}: ListCardProps) {
    const clampedProgress = Math.max(0, Math.min(100, list.progressPct));
    const badge = list.status ? statusBadge[list.status] : null;
    const checkedCount = list.checkedCount ?? 0;
    const relativeTime = list.updatedAt ? formatRelativeTime(list.updatedAt) : null;
    const isCompleted = list.status === "completed" || list.status === "archived";
    const showProgress = list.status !== "draft" && list.itemCount > 0;

    if (variant === "row") {
        return (
            <article
                className={cn(
                    "flex items-center gap-3 border-b border-divider px-4 py-3 transition-colors",
                    className,
                )}
            >
                {/* Lista */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="text-lg leading-none">{list.categoryEmoji}</span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate text-[14px] font-semibold text-text-primary">
                                {list.title}
                            </span>
                            {list.isLocked ? (
                                <Lock size={11} className="shrink-0 text-text-muted"/>
                            ) : null}
                        </div>
                        <span className="text-[11px] text-text-muted">{list.itemCount} productos</span>
                    </div>
                </div>

                {/* Estado */}
                <div className="w-24 shrink-0">
                    {badge ? (
                        <span className={cn("rounded-[8px] px-2 py-0.5 text-[11px] font-bold", badge.className)}>
                            {badge.label}
                        </span>
                    ) : null}
                </div>

                {/* Total */}
                <div className="w-20 shrink-0 text-right text-[13px] font-semibold text-text-primary">
                    {list.totalPrice != null ? formatCurrency(list.totalPrice) : "—"}
                </div>

                {/* Ahorro */}
                <div className="w-20 shrink-0 text-right text-[13px] font-semibold text-[#2E7D32]">
                    {list.estimatedSavings != null
                        ? `−${formatCurrency(list.estimatedSavings)}`
                        : <span className="text-text-muted">—</span>}
                </div>

                {/* Actualizada */}
                <div className="flex w-28 shrink-0 items-center justify-end gap-1 text-[12px] text-text-muted">
                    {relativeTime ? (
                        <>
                            <Clock size={11} className="shrink-0"/>
                            <span>{relativeTime}</span>
                        </>
                    ) : "—"}
                </div>
            </article>
        );
    }

    // ── Grid variant ──────────────────────────────────────────────────────────
    return (
        <article
            className={cn(
                "flex flex-col rounded-[18px] border border-divider bg-white p-5 transition-shadow",
                "hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)]",
                isCompleted && "opacity-75",
                className,
            )}
        >
            {/* Top: emoji box + status badge */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-[13px] border border-divider bg-[#FAF8F4] text-xl leading-none">
                    {list.categoryEmoji}
                </div>
                {badge ? (
                    <span className={cn("rounded-[8px] px-2.5 py-0.5 text-[11px] font-bold", badge.className)}>
                        {badge.label}
                    </span>
                ) : null}
            </div>

            {/* Título + lock */}
            <div className="mb-0.5 flex items-center gap-1.5">
                <h3 className="truncate text-[16px] font-bold tracking-[-0.2px] text-text-primary">
                    {list.title}
                </h3>
                {list.isLocked ? <Lock size={12} className="shrink-0 text-text-muted"/> : null}
            </div>
            <p className="mb-3 text-[12px] text-text-muted">{list.itemCount} productos</p>

            {/* Progreso */}
            {showProgress ? (
                <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] text-text-muted">
                            Completado {checkedCount}/{list.itemCount}
                        </span>
                        <span className="text-[11px] font-bold text-[#4CAF50]">
                            {Math.round(clampedProgress)}%
                        </span>
                    </div>
                    <ProgressBar
                        value={checkedCount}
                        max={list.itemCount}
                        style={{height: "4px", background: "#F0EDE6", borderRadius: "2px"}}
                    />
                </div>
            ) : (
                /* Draft: spacer so footer stays at bottom */
                <div className="mb-3"/>
            )}

            {/* Footer */}
            <div className="mt-auto">
                <div className="flex items-center justify-between gap-2">
                    <AvatarStack avatars={list.collaborators} size="sm" max={3}/>
                    {list.totalPrice != null ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[15px] font-extrabold tracking-[-0.3px] text-text-primary">
                                {formatCurrency(list.totalPrice)}
                            </span>
                            {list.estimatedSavings != null ? (
                                <span className="text-[11px] font-semibold text-[#2E7D32]">
                                    ahorra {formatCurrency(list.estimatedSavings)}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {relativeTime ? (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#AEAEB2]">
                        <Clock size={11} className="shrink-0"/>
                        <span>{relativeTime}</span>
                    </div>
                ) : null}
            </div>
        </article>
    );
}
