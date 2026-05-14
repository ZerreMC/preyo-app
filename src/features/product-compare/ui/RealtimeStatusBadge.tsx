import {Radio} from "lucide-react";

type RealtimeStatusBadgeProps = {
    label: string;
};

export function RealtimeStatusBadge({label}: RealtimeStatusBadgeProps) {
    return (
        <div className="inline-flex w-fit items-center gap-3 rounded-3xl border border-brand/25 bg-feedback-success-bg px-4 py-3 text-left text-brand-active">
            <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-25 motion-reduce:hidden"/>
                <span className="relative inline-flex size-3 rounded-full bg-brand"/>
            </span>
            <div>
                <p className="text-sm font-bold">En tiempo real</p>
                <p className="text-xs font-medium">{label}</p>
            </div>
            <Radio size={16} className="hidden sm:block"/>
        </div>
    );
}
