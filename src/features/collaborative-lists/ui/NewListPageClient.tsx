"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Check, X} from "lucide-react";
import {motion} from "motion/react";
import {Button, Input} from "@/shared/ui";
import {routes} from "@/shared/config/routes";
import {createList, listCategories} from "../client";

export function NewListPageClient() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState(listCategories[0].id);
    const [isTemplate, setIsTemplate] = useState(false);
    const [saved, setSaved] = useState(false);

    const selectedCategory = listCategories.find((category) => category.id === categoryId) ?? listCategories[0];

    const handleSave = () => {
        const normalizedTitle = title.trim();
        if (!normalizedTitle) return;
        setSaved(true);
        const newList = createList({title: normalizedTitle, categoryId, isTemplate});
        router.push(routes.listDetail(newList.id));
    };

    return (
        <div className="min-h-dvh px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-xl rounded-3xl border border-divider bg-surface p-5 shadow-[0_8px_32px_rgba(31,42,36,0.10)]">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-[22px] font-black tracking-[-0.5px] text-text-primary">Nueva lista</h1>
                        <p className="text-[13px] text-text-muted">Organiza tu próxima compra</p>
                    </div>
                    <button type="button" onClick={() => router.push(routes.lists)} className="grid size-9 place-items-center rounded-xl bg-[rgba(57,184,107,0.12)] text-text-muted">
                        <X size={17}/>
                    </button>
                </div>

                <div className="mb-5">
                    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
                        Nombre de la lista
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-divider bg-white px-4 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <span className="text-xl">{selectedCategory.emoji}</span>
                        <Input
                            autoFocus
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Ej: Compra semanal..."
                            className="text-[15px]"
                            onKeyDown={(event) => event.key === "Enter" && handleSave()}
                        />
                    </div>
                </div>

                <div className="mb-5">
                    <h2 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">Categoría</h2>
                    <div className="grid grid-cols-4 gap-2">
                        {listCategories.map((category) => {
                            const active = category.id === categoryId;
                            return (
                                <motion.button
                                    key={category.id}
                                    whileTap={{scale: 0.95}}
                                    type="button"
                                    onClick={() => setCategoryId(category.id)}
                                    className={[
                                        "flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition",
                                        active ? "border-brand bg-[rgba(57,184,107,0.12)] shadow-[0_4px_12px_rgba(57,184,107,0.15)]" : "border-divider bg-white",
                                    ].join(" ")}
                                >
                                    <span className="text-xl">{category.emoji}</span>
                                    <span className={["text-center text-[10px] font-semibold leading-tight", active ? "text-brand-active" : "text-text-muted"].join(" ")}>
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
                        <p className="text-[12px] text-text-muted">Campo mock para reutilizarla después</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsTemplate((value) => !value)}
                        className={["relative h-6 w-12 rounded-full transition", isTemplate ? "bg-brand" : "bg-divider"].join(" ")}
                        aria-pressed={isTemplate}
                    >
                        <motion.span
                            className="absolute top-0.5 size-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
                            animate={{x: isTemplate ? 24 : 2}}
                            transition={{type: "spring", stiffness: 400, damping: 28}}
                        />
                    </button>
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth className="rounded-2xl" onClick={() => router.push(routes.lists)}>
                        Cancelar
                    </Button>
                    <Button fullWidth className="rounded-2xl" disabled={!title.trim()} onClick={handleSave}>
                        {saved ? <Check size={17}/> : null}
                        {saved ? "Guardado" : "Guardar lista"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
