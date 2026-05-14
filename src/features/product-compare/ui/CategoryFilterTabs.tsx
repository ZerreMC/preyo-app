import {cn} from "@/shared/lib";
import type {ProductCategory} from "../model/types";

type CategoryFilterTabsProps = {
    selectedCategory: ProductCategory;
    onSelectCategory: (category: ProductCategory) => void;
};

const categories: Array<{ value: ProductCategory; label: string }> = [
    {value: "all", label: "Todos"},
    {value: "dairy", label: "Lácteos"},
    {value: "oils", label: "Aceites"},
    {value: "cereals", label: "Cereales"},
    {value: "drinks", label: "Bebidas"},
];

export function CategoryFilterTabs({selectedCategory, onSelectCategory}: CategoryFilterTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categorías">
            {categories.map((category) => {
                const active = category.value === selectedCategory;

                return (
                    <button
                        key={category.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={cn(
                            "min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition motion-reduce:transition-none",
                            active
                                ? "border-brand bg-brand text-white shadow-[0_6px_16px_rgba(57,184,107,0.24)]"
                                : "border-divider bg-white text-text-muted hover:bg-bg-hover hover:text-text-primary",
                        )}
                        onClick={() => onSelectCategory(category.value)}
                    >
                        {category.label}
                    </button>
                );
            })}
        </div>
    );
}
