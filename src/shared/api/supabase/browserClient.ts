import {createBrowserClient} from "@supabase/ssr";
import {assertSupabaseEnv, env, isMockDataSource} from "@/shared/config/env";
import {createMockClient} from "./mockClient";

export function createClient() {
    if (isMockDataSource()) {
        return createMockClient();
    }

    assertSupabaseEnv();

    return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
