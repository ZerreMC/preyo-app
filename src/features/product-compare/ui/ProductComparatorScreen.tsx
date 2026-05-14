"use client";

import {useProductComparator} from "../model/hooks/useProductComparator";
import {AddPriceBottomSheet} from "./AddPriceBottomSheet";
import {AddToListBottomSheet} from "./AddToListBottomSheet";
import {BottomToast} from "./BottomToast";
import {CategoryFilterTabs} from "./CategoryFilterTabs";
import {ComparatorErrorState} from "./ComparatorErrorState";
import {ComparatorHeader} from "./ComparatorHeader";
import {ComparatorLoadingSkeleton} from "./ComparatorLoadingSkeleton";
import {IntelligencePanel} from "./IntelligencePanel";
import {ProductComparisonPanel} from "./ProductComparisonPanel";
import {ProductListPanel} from "./ProductListPanel";
import {ProductSearchInput} from "./ProductSearchInput";

export function ProductComparatorScreen() {
    const comparator = useProductComparator();

    return (
        <div className="-mx-4 min-h-full bg-bg-main px-4 py-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:mx-0 lg:px-8 lg:py-8">
            <div className="mx-auto flex max-w-[92rem] flex-col gap-5">
                <ComparatorHeader realtimeLabel={comparator.realtimeLabel}/>

                <div className="flex flex-col gap-3">
                    <ProductSearchInput value={comparator.query} onChange={comparator.setQuery}/>
                    <CategoryFilterTabs
                        selectedCategory={comparator.selectedCategory}
                        onSelectCategory={comparator.setSelectedCategory}
                    />
                </div>

                {comparator.loading ? <ComparatorLoadingSkeleton/> : null}

                {!comparator.loading && comparator.error ? (
                    <ComparatorErrorState message={comparator.error}/>
                ) : null}

                {!comparator.loading && !comparator.error ? (
                    <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)_19rem]">
                        <div className="xl:sticky xl:top-6 xl:self-start">
                            <ProductListPanel
                                products={comparator.filteredProducts}
                                selectedProductId={comparator.selectedProduct?.id ?? comparator.selectedProductId}
                                onSelectProduct={comparator.setSelectedProductId}
                            />
                        </div>

                        <ProductComparisonPanel
                            product={comparator.selectedProduct}
                            realtimeLabel={comparator.realtimeLabel}
                            onAddPrice={() => comparator.setIsAddPriceOpen(true)}
                            onAddToList={() => comparator.setIsAddToListOpen(true)}
                        />

                        <div className="xl:sticky xl:top-6 xl:self-start">
                            <IntelligencePanel
                                selectedProduct={comparator.selectedProduct}
                                realtimeLabel={comparator.realtimeLabel}
                            />
                        </div>
                    </div>
                ) : null}
            </div>

            <AddPriceBottomSheet
                open={comparator.isAddPriceOpen}
                product={comparator.selectedProduct}
                onClose={() => comparator.setIsAddPriceOpen(false)}
                onSave={comparator.savePrice}
            />
            <AddToListBottomSheet
                open={comparator.isAddToListOpen}
                product={comparator.selectedProduct}
                onClose={() => comparator.setIsAddToListOpen(false)}
                onAdd={comparator.addToList}
            />
            <BottomToast toast={comparator.toast}/>
        </div>
    );
}
