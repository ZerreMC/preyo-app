import {ListsPageClient, SupabaseListRepository, getMyLists} from "@/features/collaborative-lists";
import {createClient} from "@/shared/api/supabase/serverClient";

export default async function Page() {
    const supabase = await createClient();
    const repository = new SupabaseListRepository(supabase);
    const lists = await getMyLists(repository);

    return <ListsPageClient lists={lists}/>;
}
