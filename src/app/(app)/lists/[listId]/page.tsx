import {ListDetailPageClient} from "@/features/collaborative-lists";

type ListDetailPlaceholderPageProps = {
    params: Promise<{
        listId: string;
    }>;
};

export default async function Page({params}: ListDetailPlaceholderPageProps) {
    const {listId} = await params;

    return <ListDetailPageClient listId={listId}/>;
}
