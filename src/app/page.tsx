import {createClient} from "@/shared/api/supabase/serverClient";
import LandingPage from "./(public)/LandingPage";
import {AppShell} from "@/widgets/app-shell/AppShell";

export default async function IndexPage() {
    const supabase = await createClient();

    const {
        data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
        return <LandingPage/>;
    }

    return (
        <AppShell>
            <section className="space-y-2">
                <h1 className="text-2xl font-black">Inicio</h1>
                <p className="text-sm text-text-muted">
                    Pantalla Inicio
                </p>
            </section>
        </AppShell>
    );
}
