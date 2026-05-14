import {AlertCircle, Clock, MapPin, Zap} from "lucide-react";
import Link from "next/link";

type ListSummary = {
    id: string;
    title: string;
    meta: string;
    status: string;
};

interface IntelligencePanelProps {
    recentLists: ListSummary[];
}

export function IntelligencePanel({recentLists}: IntelligencePanelProps) {
    return (
        <div className="p-5 flex flex-col gap-5">
            {/* Header */}
            <div>
                <p className="text-[13px] font-bold text-text-primary mb-0.5">Panel de inteligencia</p>
                <p className="text-[12px] text-text-muted">Actualizaciones en tiempo real</p>
            </div>

            {/* Consejo del día */}
            <div className="bg-feedback-success-bg border border-brand/30 rounded-[14px] p-3.5">
                <div className="flex items-center gap-2 mb-2">
                    <div className="size-6.5 rounded-lg bg-brand flex items-center justify-center shrink-0">
                        <Zap size={13} className="text-white fill-white"/>
                    </div>
                    <p className="text-[12px] font-bold text-brand-active">Consejo del día</p>
                </div>
                <p className="text-[13px] text-brand-active leading-normal">
                    Compara los precios antes de hacer la compra grande. Pequeñas diferencias entre tiendas
                    pueden suponer más de 5&nbsp;€ de ahorro semanal.
                </p>
                <Link
                    href="/compare"
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                >
                    Ver comparador →
                </Link>
            </div>

            {/* Mejor tienda hoy */}
            <div className="bg-white border border-divider rounded-[14px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={13} className="text-brand"/>
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.07em]">
                        Mejor tienda hoy
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center py-3 gap-1 text-center">
                    <p className="text-[24px] font-extrabold text-divider">—</p>
                    <p className="text-[12px] text-text-muted">
                        Añade productos a una lista para ver comparativas
                    </p>
                    <Link href="/compare" className="text-[12px] font-semibold text-brand hover:underline mt-1">
                        Ir al comparador
                    </Link>
                </div>
            </div>

            {/* Alertas de precio */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <AlertCircle size={13} className="text-accent-orange"/>
                        <p className="text-[12px] font-bold text-text-primary">Alertas de precio</p>
                    </div>
                </div>
                <div className="rounded-md border border-divider bg-white p-4 text-center">
                    <p className="text-[12px] text-text-muted">
                        Sin alertas activas. Actívalas desde el comparador.
                    </p>
                </div>
            </div>

            {/* Actividad reciente */}
            <div>
                <p className="text-[12px] font-bold text-text-primary mb-2.5">Actividad reciente</p>
                {recentLists.length === 0 ? (
                    <p className="text-[12px] text-text-muted">Sin actividad reciente.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {recentLists.slice(0, 4).map((list) => (
                            <div key={list.id} className="flex items-start gap-2.5">
                                <div
                                    className="size-6.5 rounded-lg bg-brand/12 flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock size={12} className="text-brand-active"/>
                                </div>
                                <div>
                                    <p className="text-xs text-nav-secondary leading-[1.4]">
                                        Lista <span className="font-semibold">{list.title}</span> actualizada
                                    </p>
                                    <p className="text-[11px] text-text-muted">{list.meta}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
