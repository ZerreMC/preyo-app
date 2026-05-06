import {PlanRoutePageClient} from "@/features/collaborative-lists";

type PlanRoutePageProps = {
    params: Promise<{
        listId: string;
    }>;
};

export default async function Page({params}: PlanRoutePageProps) {
    const {listId} = await params;

    return <PlanRoutePageClient listId={listId}/>;
}
