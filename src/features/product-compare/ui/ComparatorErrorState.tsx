import {AlertCircle} from "lucide-react";
import {Button} from "@/shared/ui";

type ComparatorErrorStateProps = {
    message?: string;
    onRetry?: () => void;
};

export function ComparatorErrorState({message = "No se pudo cargar el comparador", onRetry}: ComparatorErrorStateProps) {
    return (
        <div className="flex min-h-90 flex-col items-center justify-center rounded-3xl border border-feedback-error-border bg-feedback-error-bg px-6 py-12 text-center shadow-[0_10px_34px_rgba(31,42,36,0.06)]">
            <div className="mb-4 grid size-13 place-items-center rounded-3xl bg-white text-error">
                <AlertCircle size={24}/>
            </div>
            <p className="text-base font-black text-text-primary">{message}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
                Revisa tu conexión e inténtalo de nuevo.
            </p>
            {onRetry ? (
                <Button type="button" variant="outline" size="sm" className="mt-5" onClick={onRetry}>
                    Reintentar
                </Button>
            ) : null}
        </div>
    );
}
