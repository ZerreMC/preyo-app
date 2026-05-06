import {AddProductsPageClient} from "@/features/collaborative-lists";

type AddProductsPageProps = {
    params: Promise<{
        listId: string;
    }>;
};

export default async function Page({params}: AddProductsPageProps) {
    const {listId} = await params;

    return <AddProductsPageClient listId={listId}/>;
}
