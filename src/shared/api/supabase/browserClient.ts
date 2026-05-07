import {createBrowserClient} from "@supabase/ssr";
import {assertSupabaseEnv, env} from "@/shared/config/env";

export function createClient() {
    assertSupabaseEnv();

    return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
