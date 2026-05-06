"use client";

import {useRouter} from "next/navigation";
import {ArrowLeft, MapPin} from "lucide-react";
import {Button} from "@/shared/ui";
import {routes} from "@/shared/config/routes";

type PlanRoutePageClientProps = {
    listId: string;
};

export function PlanRoutePageClient({listId}: PlanRoutePageClientProps) {
    const router = useRouter();

    return (
        <div className="min-h-dvh px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
            <header className="mb-8 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => router.push(routes.listDetail(listId))}
                    className="grid size-9 place-items-center rounded-xl bg-[#ECF8EE] text-brand-active"
                    aria-label="Volver a la lista"
                >
                    <ArrowLeft size={17} />
                </button>
                <h1 className="text-[22px] font-black tracking-[-0.5px] text-text-primary">Planificar ruta</h1>
            </header>

            <div className="mx-auto mt-20 max-w-sm rounded-3xl border border-divider bg-surface p-8 text-center shadow-[0_8px_32px_rgba(31,42,36,0.10)]">
                <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-[#ECF8EE] text-brand-active">
                    <MapPin size={28} />
                </div>
                <h2 className="mb-3 text-[18px] font-bold text-text-primary">Planificación de rutas</h2>
                <p className="mb-6 text-[14px] text-text-muted">
                    Esta función te permitirá organizar los productos de tu lista por pasillos o supermercados para que la compra sea más rápida. Estará disponible próximamente.
                </p>
                <Button fullWidth onClick={() => router.push(routes.listDetail(listId))}>
                    Volver a la lista
                </Button>
            </div>
        </div>
    );
}
