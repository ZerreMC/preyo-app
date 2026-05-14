import {ChevronRight, TrendingDown} from "lucide-react";
import {formatCurrency} from "@/shared/lib";
import {cn} from "@/shared/lib";
import {getBestAvailablePrice} from "../model/productComparison";
import type {ComparableProduct} from "../model/types";
import {ProductIcon} from "./ProductIcon";

type ProductListItemProps = {
    product: ComparableProduct;
    selected: boolean;
    onSelect: (productId: string) => void;
};

export function ProductListItem({product, selected, onSelect}: ProductListItemProps) {
    const bestPrice = getBestAvailablePrice(product.prices);

    return (
        <button
            type="button"
            className={cn(
                "flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition motion-reduce:transition-none",
                selected
                    ? "border-brand/40 bg-brand/10 shadow-[0_8px_22px_rgba(57,184,107,0.12)]"
                    : "border-transparent bg-white hover:border-divider hover:bg-bg-hover",
            )}
            onClick={() => onSelect(product.id)}
        >
            <ProductIcon icon={product.icon}/>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-text-primary">{product.name}</p>
                <p className="mt-0.5 text-xs font-medium text-text-muted">{product.unit}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black tabular-nums text-brand-active">
                        {bestPrice?.price ? formatCurrency(bestPrice.price) : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-feedback-success-bg px-2 py-0.5 text-[11px] font-bold text-brand-active">
                        <TrendingDown size={12}/>
                        {product.savingsPercent}% ahorro
                    </span>
                </div>
            </div>

            <ChevronRight size={16} className={selected ? "text-brand-active" : "text-text-muted"}/>
        </button>
    );
}
