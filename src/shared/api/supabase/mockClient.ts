import type {SupabaseClient} from "@supabase/supabase-js";


const MOCK_USER = {
    id: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "dev@preyo.local",
    user_metadata: {display_name: "Dev Preyo"},
    app_metadata: {provider: "mock", providers: ["mock"]},
    created_at: new Date(0).toISOString(),
} as const;

const MOCK_SESSION = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: MOCK_USER,
} as const;

const ok = <T>(data: T) => Promise.resolve({data, error: null});


export function createMockClient(): SupabaseClient {
    const auth = {
        getUser: () => ok({user: MOCK_USER}),
        getSession: () => ok({session: MOCK_SESSION}),
        signInWithPassword: () => ok({user: MOCK_USER, session: MOCK_SESSION}),
        signUp: () => ok({user: MOCK_USER, session: MOCK_SESSION}),
        signOut: () => Promise.resolve({error: null}),
        exchangeCodeForSession: () => ok({user: MOCK_USER, session: MOCK_SESSION}),
    };

    return {auth} as unknown as SupabaseClient;
}
