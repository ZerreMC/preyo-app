"use client";

import {useMemo, useState, useSyncExternalStore} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Plus, Search, SlidersHorizontal} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ListCard} from "@/entities/shopping-list";
import {routes} from "@/shared/config/routes";
import {Button, Input} from "@/shared/ui";
import {getLists, subscribeToMockLists} from "../client";
import type {MockListSummary} from "../model/mockLists";

const filters = ["Todas", "Recientes", "Compartidas", "Plantillas", "En compra", "Completadas"] as const;

type Filter = (typeof filters)[number];

type ListsPageClientProps = {
    lists: MockListSummary[];
};

export function ListsPageClient({lists}: ListsPageClientProps) {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<Filter>("Todas");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const visibleLists = useSyncExternalStore(subscribeToMockLists, getLists, () => lists);

    const filteredLists = useMemo(() => {
        return visibleLists.filter((list) => {
            if (searchQuery && !list.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            if (activeFilter === "Todas" || activeFilter === "Recientes") return true;
            if (activeFilter === "Compartidas") return list.status === "compartida" || list.collaborators.length > 1;
            if (activeFilter === "Plantillas") return list.status === "plantilla";
            if (activeFilter === "En compra") return list.status === "en-compra";
            if (activeFilter === "Completadas") return list.status === "compra-completada" || list.status === "ruta-completada";

            return true;
        });
    }, [activeFilter, searchQuery, visibleLists]);

    return (
        <div className="min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-3">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h1 className="min-w-0 text-[26px] font-extrabold tracking-[-0.5px] text-text-primary">
                        Mis listas
                    </h1>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowSearch((value) => !value)}
                            className="grid size-10 place-items-center rounded-2xl border border-divider bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                            aria-label="Buscar listas"
                        >
                            <Search size={18} className="text-text-muted"/>
                        </button>
                        <button
                            type="button"
                            className="grid size-10 place-items-center rounded-2xl border border-divider bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                            aria-label="Ordenar listas"
                        >
                            <SlidersHorizontal size={18} className="text-text-muted"/>
                        </button>
                        <Button
                            size="sm"
                            leftIcon={<Plus size={15}/>}
                            className="h-10 min-w-fit shrink-0 flex-row flex-nowrap whitespace-nowrap rounded-2xl px-4 text-[13px]"
                            onClick={() => router.push(routes.newList)}
                        >
                            <span className="whitespace-nowrap">Nueva</span>
                        </Button>
                    </div>
                </div>

                <AnimatePresence initial={false}>
                    {showSearch ? (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: "auto"}}
                            exit={{opacity: 0, height: 0}}
                            className="mb-3 overflow-hidden"
                        >
                            <Input
                                autoFocus
                                leftIcon={Search}
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Buscar en mis listas..."
                                aria-label="Buscar en mis listas"
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {filters.map((filter) => {
                        const active = filter === activeFilter;
                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveFilter(filter)}
                                className={[
                                    "shrink-0 rounded-full px-4 py-2 text-[13px] transition-all",
                                    active
                                        ? "bg-brand font-bold text-white shadow-[0_4px_12px_rgba(57,184,107,0.25)]"
                                        : "border-[1.5px] border-divider bg-white font-medium text-text-muted",
                                ].join(" ")}
                            >
                                {filter}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mb-4 flex items-center justify-between px-5">
                <p className="text-[13px] text-text-muted">
                    {filteredLists.length} lista{filteredLists.length !== 1 ? "s" : ""}
                </p>
                <button type="button" className="flex items-center gap-1.5 text-[13px] font-medium text-text-muted">
                    <SlidersHorizontal size={13}/>
                    Más recientes
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredLists.length > 0 ? (
                    filteredLists.map((list) => (
                        <motion.div
                            key={list.id}
                            whileTap={{scale: 0.98}}
                            className="h-full"
                        >
                            <Link
                                href={routes.listDetail(list.id)}
                                className="block h-full rounded-3xl transition active:scale-[0.98] hover:shadow-md"
                                aria-label={`Abrir ${list.title}`}
                            >
                                <ListCard list={list} className="h-full shadow-[0_2px_10px_rgba(0,0,0,0.04)]"/>
                            </Link>
                        </motion.div>
                    ))
                ) : (
                    <div className="md:col-span-2 lg:col-span-3">
                        <EmptyState onCreate={() => router.push(routes.newList)}/>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState({onCreate}: { onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 text-5xl">🛒</div>
            <h2 className="mb-2 text-[18px] font-bold text-text-primary">Aún no tienes listas</h2>
            <p className="mb-6 text-[14px] text-text-muted">Crea tu primera lista para organizar la compra.</p>
            <Button onClick={onCreate} size="lg">
                Crear mi primera lista
            </Button>
        </div>
    );
}
