import {ShoppingBasket, TrendingDown} from "lucide-react";
import {Button} from "@/shared/ui";
import type {ComparableProduct} from "../model/types";
import {AddPriceButton} from "./AddPriceButton";
import {ProductIcon} from "./ProductIcon";
import {RealtimeStatusBadge} from "./RealtimeStatusBadge";

type SelectedProductHeaderProps = {
    product: ComparableProduct;
    realtimeLabel: string;
    onAddPrice: () => void;
    onAddToList: () => void;
};

export function SelectedProductHeader({
                                          product,
                                          realtimeLabel,
                                          onAddPrice,
                                          onAddToList,
                                      }: SelectedProductHeaderProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-divider px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
                <ProductIcon icon={product.icon} className="size-15 rounded-3xl"/>
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                        {product.categoryLabel} · {product.unit}
                    </p>
                    <h2 className="mt-1 text-xl font-black leading-tight text-text-primary sm:text-2xl">
                        {product.name}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-feedback-success-bg px-3 py-1 text-xs font-bold text-brand-active">
                            <TrendingDown size={13}/>
                            Hasta {product.savingsPercent}% de ahorro
                        </span>
                        <RealtimeStatusBadge label={realtimeLabel}/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <Button type="button" variant="outline" size="sm" leftIcon={<ShoppingBasket size={15}/>} onClick={onAddToList}>
                    Añadir a lista
                </Button>
                <AddPriceButton onClick={onAddPrice}/>
            </div>
        </div>
    );
}
