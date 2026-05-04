import Link from "next/link";
import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/shared/ui";

export default function LandingPage() {
    return (
        <main className="min-h-dvh bg-bg-main px-4 py-10 text-text-primary">
            <div className="mx-auto max-w-md space-y-6">
                <section className="space-y-3 text-center">
                    <p className="text-sm font-bold tracking-widest uppercase text-brand">
                        Preyo
                    </p>

                    <h1 className="text-4xl font-black tracking-tight">
                        Compra mejor y ahorra más.
                    </h1>

                    <p className="text-sm leading-6 text-text-muted">
                        El comparador inteligente y gestor de listas colaborativo para tu familia.
                    </p>
                </section>

                <Card variant="glass">
                    <CardHeader>
                        <CardTitle>Comienza ahora</CardTitle>
                        <CardDescription>
                            Accede a tu cuenta o crea una nueva para empezar a gestionar tus listas.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">
                        <Link href="/sign-in" className="w-full">
                            <Button fullWidth size="lg">Iniciar sesión</Button>
                        </Link>
                        <Link href="/sign-up" className="w-full">
                            <Button variant="outline" fullWidth size="lg">Crear cuenta</Button>
                        </Link>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-text-muted">
                    Versión MVP v0.1.0
                </p>
            </div>
        </main>
    );
}