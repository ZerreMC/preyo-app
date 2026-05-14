import {redirect} from "next/navigation";
import {AcceptInviteCommandHandler, SupabaseListRepository} from "@/features/collaborative-lists";
import {createClient} from "@/shared/api/supabase/serverClient";

type InvitePageProps = {
    params: Promise<{ token: string }>;
};

export default async function Page({params}: InvitePageProps) {
    const {token} = await params;
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
        redirect(`/sign-up?redirect=/lists/invite/${token}`);
    }

    const repository = new SupabaseListRepository(supabase);
    const result = await new AcceptInviteCommandHandler(repository).execute({token});

    if (!result.ok) {
        redirect("/lists");
    }

    redirect(`/lists/${result.value}`);
}
