import type {ComparableProduct} from "../model/types";
import {ComparatorEmptyState} from "./ComparatorEmptyState";
import {ProductListItem} from "./ProductListItem";

type ProductListPanelProps = {
    products: ComparableProduct[];
    selectedProductId: string | null;
    onSelectProduct: (productId: string) => void;
};

export function ProductListPanel({products, selectedProductId, onSelectProduct}: ProductListPanelProps) {
    return (
        <section className="rounded-3xl border border-divider bg-white p-3 shadow-[0_10px_34px_rgba(31,42,36,0.06)]">
            <div className="px-2 pb-3 pt-1">
                <p className="text-sm font-black text-text-primary">Productos</p>
                <p className="mt-1 text-xs text-text-muted">Selecciona un producto para ver precios por supermercado</p>
            </div>

            {products.length === 0 ? (
                <ComparatorEmptyState
                    title="Busca un producto para comparar precios"
                    description="Prueba con otra categoría o cambia el texto de búsqueda."
                    compact
                />
            ) : (
                <div className="flex flex-col gap-2">
                    {products.map((product) => (
                        <ProductListItem
                            key={product.id}
                            product={product}
                            selected={product.id === selectedProductId}
                            onSelect={onSelectProduct}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
