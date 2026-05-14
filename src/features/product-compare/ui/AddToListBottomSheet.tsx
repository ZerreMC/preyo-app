"use client";

import {useState} from "react";
import {ListPlus, PackagePlus, X} from "lucide-react";
import {Button, Input} from "@/shared/ui";
import type {ComparableProduct} from "../model/types";

type ListDraft = {
    listId: string;
    quantity: string;
};

type AddToListBottomSheetProps = {
    open: boolean;
    product: ComparableProduct | null;
    onClose: () => void;
    onAdd: (draft: ListDraft) => boolean;
};

const demoLists = [
    {id: "weekly", name: "Compra semanal"},
    {id: "pantry", name: "Despensa"},
    {id: "family", name: "Casa familiar"},
];

export function AddToListBottomSheet({open, product, onClose, onAdd}: AddToListBottomSheetProps) {
    if (!open) return null;

    return (
        <AddToListForm
            key={`${product?.id ?? "empty"}-${open ? "open" : "closed"}`}
            product={product}
            onClose={onClose}
            onAdd={onAdd}
        />
    );
}

function AddToListForm({
                           product,
                           onClose,
                           onAdd,
                       }: Omit<AddToListBottomSheetProps, "open">) {
    const [listId, setListId] = useState(demoLists[0]?.id ?? "");
    const [quantity, setQuantity] = useState("1");

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-text-primary/35 px-3 pb-3 sm:items-center sm:p-6">
            <div className="w-full max-w-lg rounded-3xl border border-divider bg-white shadow-[0_24px_80px_rgba(31,42,36,0.24)]">
                <div className="flex items-center justify-between border-b border-divider px-5 py-4">
                    <div>
                        <p className="text-lg font-black text-text-primary">Añadir a una lista</p>
                        <p className="text-sm text-text-muted">{product?.name ?? "Producto seleccionado"}</p>
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
                        onAdd({listId, quantity});
                    }}
                >
                    <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-text-primary">Selecciona una lista</span>
                        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-divider bg-bg-main px-4 py-3">
                            <ListPlus size={16} className="text-text-muted"/>
                            <select
                                value={listId}
                                onChange={(event) => setListId(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none"
                            >
                                {demoLists.map((list) => (
                                    <option key={list.id} value={list.id}>{list.name}</option>
                                ))}
                            </select>
                        </div>
                    </label>

                    <Input label="Cantidad" value={quantity} leftIcon={PackagePlus} onChange={(event) => setQuantity(event.target.value)}/>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Añadir producto
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
