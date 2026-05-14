import {Sparkles} from "lucide-react";
import {RealtimeStatusBadge} from "./RealtimeStatusBadge";

type ComparatorHeaderProps = {
    realtimeLabel: string;
};

export function ComparatorHeader({realtimeLabel}: ComparatorHeaderProps) {
    return (
        <header className="flex flex-col gap-4 rounded-3xl border border-divider bg-white px-5 py-5 shadow-[0_10px_34px_rgba(31,42,36,0.06)] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand-active">
                    <Sparkles size={14}/>
                    Precios sincronizados
                </div>
                <h1 className="text-[28px] font-black leading-tight tracking-normal text-text-primary sm:text-[34px]">
                    Comparador de precios
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
                    Compara productos entre supermercados en tiempo real
                </p>
            </div>

            <RealtimeStatusBadge label={realtimeLabel}/>
        </header>
    );
}
