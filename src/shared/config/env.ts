export type PreyoDataSource = "mock" | "supabase";

const dataSource = readDataSource();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

function readDataSource(): PreyoDataSource {
    const value = process.env.NEXT_PUBLIC_PREYO_DATA_SOURCE ?? "mock";

    if (value !== "mock" && value !== "supabase") {
        throw new Error("NEXT_PUBLIC_PREYO_DATA_SOURCE must be mock or supabase");
    }

    if (process.env.NODE_ENV === "production" && value === "mock") {
        throw new Error("Production must use NEXT_PUBLIC_PREYO_DATA_SOURCE=supabase");
    }

    return value;
}

export const env = {
    dataSource,
    supabaseUrl,
    supabaseAnonKey,
} as const;

export function isMockDataSource() {
    return env.dataSource === "mock";
}

export function assertSupabaseEnv() {
    if (env.dataSource !== "supabase") {
        return;
    }

    if (!env.supabaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!env.supabaseAnonKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
}
