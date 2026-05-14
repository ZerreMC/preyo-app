import {BellRing} from "lucide-react";
import type {ComparableProduct} from "../model/types";

type PriceAlertsListProps = {
    product: ComparableProduct | null;
};

export function PriceAlertsList({product}: PriceAlertsListProps) {
    const alerts = product
        ? [
            `${product.name} bajó esta semana`,
            "Mercaval actualizó precios hoy",
        ]
        : [];

    return (
        <section className="rounded-3xl border border-divider bg-white p-4 shadow-[0_4px_16px_rgba(31,42,36,0.04)]">
            <div className="mb-3 flex items-center gap-2">
                <BellRing size={15} className="text-accent-orange"/>
                <p className="text-sm font-black text-text-primary">Alertas de precio</p>
            </div>

            {alerts.length === 0 ? (
                <p className="text-sm leading-6 text-text-muted">
                    Sin alertas activas. Elige un producto para ver oportunidades.
                </p>
            ) : (
                <div className="space-y-2">
                    {alerts.map((alert) => (
                        <div key={alert} className="rounded-2xl bg-bg-main px-3 py-2">
                            <p className="text-sm font-semibold leading-5 text-text-primary">{alert}</p>
                            <button type="button" className="mt-1 text-xs font-bold text-brand hover:text-brand-active">
                                Ver precio
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
