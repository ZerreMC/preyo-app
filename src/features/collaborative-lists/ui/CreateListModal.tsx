"use client";

import {useState, type FormEvent} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Check, X} from "lucide-react";
import {Button, Toggle} from "@/shared/ui";

const categories = [
    {id: "semanal", emoji: "🛒", label: "Semanal"},
    {id: "cena", emoji: "🍽️", label: "Cena"},
    {id: "especial", emoji: "🎉", label: "Especial"},
    {id: "salud", emoji: "🥗", label: "Salud"},
    {id: "bebe", emoji: "🍼", label: "Bebé"},
    {id: "casa", emoji: "🏠", label: "Casa"},
    {id: "mascotas", emoji: "🐾", label: "Mascotas"},
    {id: "evento", emoji: "🥂", label: "Evento"},
] as const;

export type CreateListInput = {
    name: string;
    categoryId: string;
    categoryEmoji: string;
    isTemplate: boolean;
};

type CreateListModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate?: (input: CreateListInput) => void;
};

export function CreateListModal({open, onOpenChange, onCreate}: CreateListModalProps) {
    const [name, setName] = useState("");
    const [categoryId, setCategoryId] = useState<(typeof categories)[number]["id"]>("semanal");
    const [isTemplate, setIsTemplate] = useState(false);
    const [saved, setSaved] = useState(false);

    const selectedCategory = categories.find((category) => category.id === categoryId) ?? categories[0];

    const close = () => onOpenChange(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = name.trim();

        if (!trimmedName) {
            return;
        }

        setSaved(true);
        onCreate?.({
            name: trimmedName,
            categoryId,
            categoryEmoji: selectedCategory.emoji,
            isTemplate,
        });

        window.setTimeout(() => {
            setSaved(false);
            setName("");
            setIsTemplate(false);
            setCategoryId("semanal");
            close();
        }, 450);
    };

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[80] flex flex-col justify-end bg-[rgba(31,42,36,0.5)] backdrop-blur-[6px]"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            close();
                        }
                    }}
                >
                    <motion.form
                        initial={{y: "100%", opacity: 0}}
                        animate={{y: 0, opacity: 1}}
                        exit={{y: "100%", opacity: 0}}
                        transition={{type: "spring", stiffness: 400, damping: 40}}
                        onSubmit={handleSubmit}
                        className="max-h-[90dvh] overflow-y-auto rounded-t-[2rem] bg-bg-main p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_48px_rgba(0,0,0,0.18)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-5 flex justify-center">
                            <div className="h-1 w-10 rounded-full bg-divider"/>
                        </div>

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-[22px] font-black tracking-[-0.5px] text-text-primary">
                                    Nueva lista
                                </h2>
                                <p className="text-[13px] text-text-muted">Organiza tu próxima compra</p>
                            </div>
                            <button
                                type="button"
                                onClick={close}
                                className="grid size-9 place-items-center rounded-xl bg-[rgba(57,184,107,0.14)] text-text-muted"
                                aria-label="Cerrar"
                            >
                                <X size={17}/>
                            </button>
                        </div>

                        <div className="mb-5">
                            <label htmlFor="list-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-text-muted">
                                Nombre de la lista
                            </label>
                            <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-divider bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:border-brand focus-within:ring-[3px] focus-within:ring-[rgba(57,184,107,0.1)]">
                                <span className="text-xl">{selectedCategory.emoji}</span>
                                <input
                                    id="list-name"
                                    autoFocus
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Ej: Compra semanal..."
                                    className="min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
                                />
                            </div>
                        </div>

                        <div className="mb-5">
                            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                                Categoría
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                {categories.map((category) => {
                                    const active = category.id === categoryId;
                                    return (
                                        <motion.button
                                            key={category.id}
                                            type="button"
                                            whileTap={{scale: 0.93}}
                                            onClick={() => setCategoryId(category.id)}
                                            className={[
                                                "flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] p-3 transition-all",
                                                active
                                                    ? "border-brand bg-[rgba(57,184,107,0.14)] shadow-[0_4px_12px_rgba(57,184,107,0.15)]"
                                                    : "border-divider bg-white",
                                            ].join(" ")}
                                        >
                                            <span className="text-xl">{category.emoji}</span>
                                            <span className={active ? "text-[10px] font-bold leading-tight text-brand-active" : "text-[10px] font-medium leading-tight text-text-muted"}>
                                                {category.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-6 flex items-center justify-between rounded-2xl border border-divider bg-white p-4">
                            <div>
                                <p className="text-[14px] font-semibold text-text-primary">Guardar como plantilla</p>
                                <p className="text-[12px] text-text-muted">Reutiliza esta lista en futuras compras</p>
                            </div>
                            <Toggle checked={isTemplate} onCheckedChange={setIsTemplate}/>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="secondary" fullWidth size="lg" onClick={close}>
                                Cancelar
                            </Button>
                            <Button type="submit" fullWidth size="lg" disabled={!name.trim()}>
                                {saved ? <Check size={17} strokeWidth={3}/> : null}
                                {saved ? "Guardado" : "Guardar lista"}
                            </Button>
                        </div>
                    </motion.form>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
