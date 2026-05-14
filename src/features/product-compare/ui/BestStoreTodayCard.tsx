import {MapPin} from "lucide-react";
import {formatCurrency} from "@/shared/lib";
import {getBestAvailablePrice} from "../model/productComparison";
import type {ComparableProduct} from "../model/types";

type BestStoreTodayCardProps = {
    product: ComparableProduct | null;
};

export function BestStoreTodayCard({product}: BestStoreTodayCardProps) {
    const bestPrice = product ? getBestAvailablePrice(product.prices) : null;

    return (
        <section className="rounded-3xl border border-divider bg-white p-4 shadow-[0_4px_16px_rgba(31,42,36,0.04)]">
            <div className="mb-4 flex items-center gap-2">
                <MapPin size={15} className="text-brand"/>
                <p className="text-xs font-black uppercase tracking-[0.07em] text-text-muted">Mejor tienda hoy</p>
            </div>

            {bestPrice?.price ? (
                <div>
                    <p className="text-xl font-black text-text-primary">{bestPrice.storeName}</p>
                    <p className="mt-1 text-3xl font-black tabular-nums text-brand-active">
                        {formatCurrency(bestPrice.price)}
                    </p>
                    <button type="button" className="mt-3 text-sm font-bold text-brand hover:text-brand-active">
                        Ver precio
                    </button>
                </div>
            ) : (
                <p className="text-sm leading-6 text-text-muted">
                    Selecciona un producto para ver la mejor tienda disponible.
                </p>
            )}
        </section>
    );
}
