"use client";

import {useState} from "react";
import {CalendarDays, Euro, Store, X} from "lucide-react";
import {Button, Input} from "@/shared/ui";
import type {ComparableProduct} from "../model/types";

type PriceDraft = {
    productId: string;
    storeName: string;
    price: string;
    unit: string;
    date: string;
};

type AddPriceBottomSheetProps = {
    open: boolean;
    product: ComparableProduct | null;
    onClose: () => void;
    onSave: (draft: PriceDraft) => boolean;
};

const storeOptions = ["Mercaval", "Aldi Sol", "BonPreu", "Carretera", "Condis Plus"];

export function AddPriceBottomSheet({open, product, onClose, onSave}: AddPriceBottomSheetProps) {
    if (!open) return null;

    return (
        <AddPriceForm
            key={`${product?.id ?? "empty"}-${open ? "open" : "closed"}`}
            product={product}
            onClose={onClose}
            onSave={onSave}
        />
    );
}

function AddPriceForm({
                         product,
                         onClose,
                         onSave,
                     }: Omit<AddPriceBottomSheetProps, "open">) {
    const [storeName, setStoreName] = useState(storeOptions[0]);
    const [price, setPrice] = useState("");
    const [unit, setUnit] = useState(product?.unit ?? "");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-text-primary/35 px-3 pb-3 sm:items-center sm:p-6">
            <div className="w-full max-w-lg rounded-3xl border border-divider bg-white shadow-[0_24px_80px_rgba(31,42,36,0.24)]">
                <div className="flex items-center justify-between border-b border-divider px-5 py-4">
                    <div>
                        <p className="text-lg font-black text-text-primary">Añadir precio</p>
                        <p className="text-sm text-text-muted">Registra una referencia para comparar mejor.</p>
                    </div>
                    <button
                        type="button"
                        className="grid size-9 place-items-center rounded-full border border-divider text-text-muted hover:bg-bg-hover"
                        aria-label="Cerrar"
                        onClick={onClose}
                    >
                        <X size={16}/>
                    </button>
                </div>

                <form
                    className="space-y-4 px-5 py-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!product) return;
                        onSave({productId: product.id, storeName, price, unit, date});
                    }}
                >
                    <Input label="Producto" value={product?.name ?? ""} readOnly/>

                    <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-text-primary">Supermercado</span>
                        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-divider bg-bg-main px-4 py-3">
                            <Store size={16} className="text-text-muted"/>
                            <select
                                value={storeName}
                                onChange={(event) => setStoreName(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none"
                            >
                                {storeOptions.map((store) => (
                                    <option key={store} value={store}>{store}</option>
                                ))}
                            </select>
                        </div>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Precio" inputMode="decimal" value={price} leftIcon={Euro} placeholder="0,00" onChange={(event) => setPrice(event.target.value)}/>
                        <Input label="Unidad" value={unit} placeholder="Botella 1 L" onChange={(event) => setUnit(event.target.value)}/>
                    </div>

                    <Input label="Fecha" type="date" value={date} leftIcon={CalendarDays} onChange={(event) => setDate(event.target.value)}/>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Guardar precio
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
