import {CheckCircle2, Info, XCircle} from "lucide-react";
import {cn} from "@/shared/lib";
import type {ComparatorToast} from "../model/types";

type BottomToastProps = {
    toast: ComparatorToast | null;
};

const toneStyles = {
    success: "bg-text-primary text-white",
    error: "bg-feedback-error-bg text-error border border-feedback-error-border",
    info: "bg-white text-text-primary border border-divider",
} as const;

const toneIcons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
} as const;

export function BottomToast({toast}: BottomToastProps) {
    if (!toast) return null;

    const Icon = toneIcons[toast.tone];

    return (
        <div
            role={toast.tone === "error" ? "alert" : undefined}
            aria-live={toast.tone === "error" ? undefined : "polite"}
            className={cn(
                "fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-3 text-sm font-bold shadow-[0_14px_40px_rgba(31,42,36,0.18)] motion-reduce:transition-none",
                toneStyles[toast.tone],
            )}
        >
            <Icon size={16}/>
            {toast.message}
        </div>
    );
}
