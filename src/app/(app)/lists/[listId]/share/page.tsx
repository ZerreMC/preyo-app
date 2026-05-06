import {ShareListPageClient} from "@/features/collaborative-lists";

type ShareListPageProps = {
    params: Promise<{
        listId: string;
    }>;
};

export default async function Page({params}: ShareListPageProps) {
    const {listId} = await params;

    return <ShareListPageClient listId={listId}/>;
}
