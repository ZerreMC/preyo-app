import type {ComparableProduct} from "../model/types";
import {BestStoreTodayCard} from "./BestStoreTodayCard";
import {DailyTipCard} from "./DailyTipCard";
import {PriceAlertsList} from "./PriceAlertsList";
import {RealtimeStatusBadge} from "./RealtimeStatusBadge";

type IntelligencePanelProps = {
    selectedProduct: ComparableProduct | null;
    realtimeLabel: string;
};

export function IntelligencePanel({selectedProduct, realtimeLabel}: IntelligencePanelProps) {
    return (
        <aside className="flex flex-col gap-4 rounded-3xl border border-divider bg-white/80 p-4 shadow-[0_10px_34px_rgba(31,42,36,0.05)]">
            <div>
                <p className="text-base font-black text-text-primary">Panel de inteligencia</p>
                <p className="mt-1 text-sm text-text-muted">Actualizaciones en tiempo real</p>
            </div>

            <RealtimeStatusBadge label={realtimeLabel}/>
            <DailyTipCard/>
            <BestStoreTodayCard product={selectedProduct}/>
            <PriceAlertsList product={selectedProduct}/>
        </aside>
    );
}
