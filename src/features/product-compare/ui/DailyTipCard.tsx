import {Zap} from "lucide-react";

export function DailyTipCard() {
    return (
        <section className="rounded-3xl border border-brand/25 bg-feedback-success-bg p-4">
            <div className="mb-3 flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-2xl bg-brand text-white">
                    <Zap size={16} fill="currentColor"/>
                </div>
                <p className="text-sm font-black text-brand-active">Consejo del día</p>
            </div>
            <p className="text-sm leading-6 text-brand-active">
                Revisa el precio por unidad antes de elegir. Un envase más grande no siempre es más barato.
            </p>
        </section>
    );
}
