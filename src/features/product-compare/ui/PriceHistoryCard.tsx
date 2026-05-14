import {formatCurrency} from "@/shared/lib";
import type {PriceHistoryPoint} from "../model/types";

type PriceHistoryCardProps = {
    history: PriceHistoryPoint[];
};

export function PriceHistoryCard({history}: PriceHistoryCardProps) {
    const values = history.map((point) => point.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const current = values.at(-1) ?? 0;
    const range = Math.max(max - min, 0.01);
    const points = history.map((point, index) => {
        const x = history.length <= 1 ? 0 : (index / (history.length - 1)) * 100;
        const y = 90 - ((point.price - min) / range) * 70;
        return `${x},${y}`;
    }).join(" ");

    return (
        <section className="rounded-3xl border border-divider bg-white p-5 shadow-[0_10px_34px_rgba(31,42,36,0.06)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-base font-black text-text-primary">Historial de precio</h3>
                    <p className="mt-1 text-sm text-text-muted">Últimos 6 meses</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <Summary label="Mínimo" value={formatCurrency(min)}/>
                    <Summary label="Máximo" value={formatCurrency(max)}/>
                    <Summary label="Actual" value={formatCurrency(current)} strong/>
                </div>
            </div>

            <div className="rounded-3xl border border-divider bg-bg-main px-4 py-4">
                <svg viewBox="0 0 100 100" role="img" aria-label="Evolución del precio durante seis meses" className="h-40 w-full overflow-visible">
                    <defs>
                        <linearGradient id="price-history-fill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.20"/>
                            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    <polyline
                        points={`0,96 ${points} 100,96`}
                        fill="url(#price-history-fill)"
                        stroke="none"
                    />
                    <polyline
                        points={points}
                        fill="none"
                        stroke="var(--color-brand-active)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {history.map((point, index) => {
                        const x = history.length <= 1 ? 0 : (index / (history.length - 1)) * 100;
                        const y = 90 - ((point.price - min) / range) * 70;

                        return (
                            <circle key={point.month} cx={x} cy={y} r={index === history.length - 1 ? 3.3 : 2.5} fill="white" stroke="var(--color-brand-active)" strokeWidth="2"/>
                        );
                    })}
                </svg>
                <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[11px] font-bold text-text-muted">
                    {history.map((point) => (
                        <span key={point.month}>{point.month}</span>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Summary({label, value, strong = false}: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="rounded-2xl border border-divider bg-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">{label}</p>
            <p className={strong ? "text-sm font-black text-brand-active" : "text-sm font-black text-text-primary"}>{value}</p>
        </div>
    );
}
