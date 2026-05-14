import {Search} from "lucide-react";

type ProductSearchInputProps = {
    value: string;
    onChange: (value: string) => void;
};

export function ProductSearchInput({value, onChange}: ProductSearchInputProps) {
    return (
        <label className="block">
            <span className="sr-only">Buscar producto</span>
            <div className="flex min-h-13 items-center gap-3 rounded-3xl border border-divider bg-white px-4 shadow-[0_6px_18px_rgba(31,42,36,0.05)] transition focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/12">
                <Search size={18} className="shrink-0 text-text-muted"/>
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    type="search"
                    placeholder="Buscar producto, marca o categoría..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
                />
            </div>
        </label>
    );
}
