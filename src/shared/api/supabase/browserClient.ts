import {createBrowserClient} from "@supabase/ssr";
import {assertSupabaseEnv, env} from "@/shared/config/env";
import type {Database} from "@/shared/api/supabase/types/database.types";

export function createClient() {
    assertSupabaseEnv();

    return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
