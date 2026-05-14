import {Award} from "lucide-react";
import {getBestAvailablePrice, getRankedStorePrices} from "../model/productComparison";
import type {StorePrice} from "../model/types";
import {StorePriceRow} from "./StorePriceRow";

type StorePriceRankingProps = {
    prices: StorePrice[];
};

export function StorePriceRanking({prices}: StorePriceRankingProps) {
    const bestPrice = getBestAvailablePrice(prices);
    const rankedPrices = getRankedStorePrices(prices);

    return (
        <section className="px-5 py-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-base font-black text-text-primary">Precio por supermercado</p>
                    <p className="mt-1 text-xs text-text-muted">Ordenado de menor a mayor precio</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand-active">
                    <Award size={14}/>
                    Mejor precio
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                {rankedPrices.map((price) => (
                    <StorePriceRow key={price.storeId} price={price} bestPrice={bestPrice}/>
                ))}
            </div>
        </section>
    );
}
