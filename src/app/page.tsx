import {Button, Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/shared/ui";

export default function Home() {
    return (
        <main className="min-h-dvh bg-[var(--color-bg-main)] px-4 py-10 text-[var(--color-text-primary)]">
            <div className="mx-auto max-w-md space-y-6">
                <section className="space-y-3">
                    <p className="text-sm font-medium text-[var(--color-brand-active)]">
                        Preyo
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Compra mejor y ahorra más.
                    </h1>

                    <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                        Base del MVP: tokens
                    </p>
                </section>

                <Card variant="glass">
                    <CardHeader>
                        <CardTitle>UI foundation</CardTitle>
                        <CardDescription>
                            Componentes base
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex gap-3">
                        <Button>Empezar</Button>
                        <Button variant="outline">Ver demo</Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}