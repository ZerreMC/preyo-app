import {CheckCircle2, Clock3, MinusCircle} from "lucide-react";
import {formatCurrency} from "@/shared/lib";
import {cn} from "@/shared/lib";
import {getPriceDeltaLabel} from "../model/productComparison";
import type {StorePrice} from "../model/types";

type StorePriceRowProps = {
    price: StorePrice;
    bestPrice: StorePrice | null;
};

function getStatusLabel(price: StorePrice) {
    if (price.status === "unavailable") return "Sin stock";
    if (price.status === "stale") return `Disponible · ${price.updatedAtLabel}`;
    return `Disponible · ${price.updatedAtLabel}`;
}

export function StorePriceRow({price, bestPrice}: StorePriceRowProps) {
    const isBest = price.status === "available" && price.storeId === bestPrice?.storeId;
    const isMuted = price.status !== "available";

    return (
        <div
            className={cn(
                "grid grid-cols-[1fr_auto] gap-3 rounded-3xl border px-4 py-3 transition motion-reduce:transition-none sm:grid-cols-[1.2fr_0.8fr_auto]",
                isBest
                    ? "border-brand/35 bg-feedback-success-bg shadow-[0_8px_24px_rgba(57,184,107,0.12)]"
                    : "border-divider bg-white",
                isMuted && "opacity-58",
            )}
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", isBest ? "bg-brand" : "bg-divider")}/>
                    <p className="truncate text-sm font-black text-text-primary">{price.storeName}</p>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                    {price.status === "unavailable" ? <MinusCircle size={13}/> : price.status === "stale" ? <Clock3 size={13}/> : <CheckCircle2 size={13}/>}
                    <span>{getStatusLabel(price)}</span>
                </div>
            </div>

            <div className="hidden min-w-0 flex-col justify-center sm:flex">
                <p className={cn("text-xs font-bold", isBest ? "text-brand-active" : "text-text-muted")}>
                    {getPriceDeltaLabel(price, bestPrice)}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{price.unitPrice}</p>
            </div>

            <div className="text-right">
                <p className={cn("text-lg font-black tabular-nums", isBest ? "text-brand-active" : "text-text-primary")}>
                    {price.price === null ? "—" : formatCurrency(price.price)}
                </p>
                <p className={cn("mt-1 text-xs font-bold sm:hidden", isBest ? "text-brand-active" : "text-text-muted")}>
                    {getPriceDeltaLabel(price, bestPrice)}
                </p>
            </div>
        </div>
    );
}
