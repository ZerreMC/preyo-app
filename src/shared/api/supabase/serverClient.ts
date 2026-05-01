import {createServerClient, type CookieOptions} from "@supabase/ssr";
import {cookies} from "next/headers";
import {env} from "@/shared/config/env";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(
                cookiesToSet: Array<{
                    name: string;
                    value: string;
                    options: CookieOptions;
                }>,
            ) {
                try {
                    cookiesToSet.forEach(({name, value, options}) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // El proxy refresca la sesión cuando no se pueden escribir cookies aquí.
                }
            },
        },
    });
}