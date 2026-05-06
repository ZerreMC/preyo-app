import {ListsPageClient, mockLists, toListSummary} from "@/features/collaborative-lists";

export default function Page() {
    return <ListsPageClient lists={mockLists.map(toListSummary)}/>;
}
