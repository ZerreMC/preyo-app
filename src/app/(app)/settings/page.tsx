import {SignOutButton} from "@/features/auth";

export default function SettingsPage() {
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-black">Perfil</h1>
                <p className="text-sm text-text-muted">
                    Placeholder de configuración del usuario.
                </p>
            </div>

            <div className="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-md">
                <h2 className="mb-3 text-sm font-bold text-text-primary">
                    Sesión
                </h2>

                <SignOutButton/>
            </div>
        </section>
    );
}