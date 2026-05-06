import {Lock} from "lucide-react";
import {AvatarStack} from "@/shared/ui";
import {cn, formatCurrency} from "@/shared/lib";

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
    itemCount: number;
    totalPrice: number;
    progressPct: number;
    collaborators: ListCardCollaborator[];
    isLocked?: boolean;
};

export type ListCardProps = {
    list: ListCardData;
    className?: string;
};

export function ListCard({list, className}: ListCardProps) {
    const clampedProgress = Math.max(0, Math.min(100, list.progressPct));

    return (
        <article className={cn("flex items-center gap-3 rounded-3xl border border-divider bg-white p-4", className)}>
            <div
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(57,184,107,0.14)] text-2xl">
                {list.categoryEmoji}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <h3 className="truncate text-[14px] font-bold text-text-primary">{list.title}</h3>
                        {list.isLocked ? <Lock size={12} className="shrink-0 text-text-muted"/> : null}
                    </div>
                    <div className="shrink-0">
                        <AvatarStack avatars={list.collaborators} size="sm" max={3}/>
                    </div>
                </div>

                <p className="mt-0.5 text-[11px] text-text-muted">
                    {list.itemCount} productos &middot; {formatCurrency(list.totalPrice)}
                </p>

                <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-divider">
                        <div
                            className="h-full rounded-full bg-brand"
                            style={{width: `${clampedProgress}%`}}
                        />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[10px] font-medium text-text-muted">
                        {Math.round(clampedProgress)}%
                    </span>
                </div>
            </div>
        </article>
    );
}
