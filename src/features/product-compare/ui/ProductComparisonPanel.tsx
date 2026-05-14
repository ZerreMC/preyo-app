import type {ComparableProduct} from "../model/types";
import {ComparatorEmptyState} from "./ComparatorEmptyState";
import {PriceHistoryCard} from "./PriceHistoryCard";
import {SelectedProductHeader} from "./SelectedProductHeader";
import {StorePriceRanking} from "./StorePriceRanking";

type ProductComparisonPanelProps = {
    product: ComparableProduct | null;
    realtimeLabel: string;
    onAddPrice: () => void;
    onAddToList: () => void;
};

export function ProductComparisonPanel({
                                           product,
                                           realtimeLabel,
                                           onAddPrice,
                                           onAddToList,
                                       }: ProductComparisonPanelProps) {
    if (!product) {
        return (
            <ComparatorEmptyState
                title="Selecciona un producto para ver precios por supermercado"
                description="Elige un producto de la lista o busca por nombre, marca o categoría."
            />
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <section className="overflow-hidden rounded-3xl border border-divider bg-white shadow-[0_10px_34px_rgba(31,42,36,0.06)]">
                <SelectedProductHeader
                    product={product}
                    realtimeLabel={realtimeLabel}
                    onAddPrice={onAddPrice}
                    onAddToList={onAddToList}
                />
                <StorePriceRanking prices={product.prices}/>
            </section>

            <PriceHistoryCard history={product.history}/>
        </div>
    );
}
