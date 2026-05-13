import {redirect} from "next/navigation";
import {HomeScreen} from "@/widgets/home-screen";
import {createClient} from "@/shared/api/supabase/serverClient";
import type {HomeScreenProps} from "@/widgets/home-screen";
import type {Database} from "@/shared/api/supabase/types/database.types";

type ListStatus = Database["public"]["Enums"]["list_status"];

type RecentListStatus = "en-compra" | "borrador" | "plantilla" | "compartida" | "completada";

function mapListStatus(status: ListStatus): RecentListStatus {
    switch (status) {
        case "shopping":
            return "en-compra";
        case "completed":
            return "completada";
        case "archived":
            return "completada";
        default:
            return "borrador";
    }
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
}

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "ahora mismo";
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
}

export default async function HomePage() {
    const supabase = await createClient();

    const {data: {user}} = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    const [{data: profile}, {data: lists}] = await Promise.all([
        supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", user.id)
            .single(),
        supabase
            .from("shopping_lists")
            .select("id, title, status, updated_at")
            .eq("owner_id", user.id)
            .order("updated_at", {ascending: false})
            .limit(10),
    ]);

    const displayName =
        profile?.display_name ??
        user.email?.split("@")[0] ??
        "Usuario";

    const allLists = lists ?? [];

    const activeListRow = allLists.find(
        (l) => l.status === "shopping" || l.status === "active",
    ) ?? null;

    let activeListProps: HomeScreenProps["activeList"] = null;

    if (activeListRow) {
        const [{data: items}, {data: collabs}] = await Promise.all([
            supabase
                .from("shopping_list_items")
                .select("id, checked")
                .eq("list_id", activeListRow.id),
            supabase
                .from("shopping_list_collaborators")
                .select("user_id, role")
                .eq("list_id", activeListRow.id),
        ]);

        const allItems = items ?? [];
        const checkedCount = allItems.filter((i) => i.checked).length;
        const totalCount = allItems.length;
        const progress = totalCount > 0 ? checkedCount / totalCount : 0;

        const collaboratorList = (collabs ?? []).map((c, idx) => ({
            id: c.user_id,
            initials: `C${idx + 1}`,
            color: idx % 2 === 0 ? "#39B86B" : "#FF8A3D",
        }));

        activeListProps = {
            id: activeListRow.id,
            title: activeListRow.title,
            progress,
            checkedCount,
            totalCount,
            estimatedTotalLabel: "",
            subtitle: `Actualizado ${formatRelativeTime(activeListRow.updated_at)}`,
            imageSrc: "",
            collaborators: collaboratorList,
        };
    }

    const recentLists = allLists.slice(0, 5).map((l) => ({
        id: l.id,
        title: l.title,
        meta: `Actualizado ${formatRelativeTime(l.updated_at)}`,
        status: mapListStatus(l.status),
        emoji: "🛒" as const,
    }));

    const formattedDate = new Date().toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    return (
        <div className="-mx-4 -mt-2 lg:mx-0 lg:mt-0">
            <HomeScreen
                greeting={getGreeting()}
                displayName={displayName}
                formattedDate={formattedDate}
                activeList={activeListProps}
                recentLists={recentLists}
                quickActions={{
                    primary: {href: "/lists/new", label: "Nueva lista", sub: "Crear rápido"},
                    secondary: {href: "/compare", label: "Comparar tiendas", sub: "Ver precios"},
                }}
            />
        </div>
    );
}
