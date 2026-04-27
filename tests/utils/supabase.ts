import {createClient, type SupabaseClient} from '@supabase/supabase-js';

type PublicSupabaseEnv = {
    supabaseUrl: string;
    supabaseAnonKey: string;
};

type IntegrationSupabaseEnv =
    | (PublicSupabaseEnv & {
        canRun: true;
        supabaseServiceRoleKey: string;
    })
    | {
        canRun: false;
        reason: string;
    };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

export const integrationSupabaseEnv = validateIntegrationSupabaseEnv();

export const canRunSupabaseIntegrationTests = integrationSupabaseEnv.canRun;
export const supabaseIntegrationSkipReason = integrationSupabaseEnv.canRun
    ? null
    : integrationSupabaseEnv.reason;

export const createAuthClient = () => {
    const env = getPublicSupabaseEnv();

    return createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            storageKey: createTestStorageKey(),
        }
    });
};

export const createAdminClient = () => {
    const env = getIntegrationSupabaseEnv();

    return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            storageKey: createTestStorageKey(),
        }
    });
};

export const createTestUser = async () => {
    const adminClient = createAdminClient();
    const client = createAuthClient();
    const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
    const password = 'testpassword123';

    // 1. Admin creates user bypassing email confirmation
    const {error: adminError} = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (adminError) throw adminError;

    // 2. Normal client signs in to get the session/token for RLS testing
    const {data: authData, error: authError} = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Supabase sign-in did not return a user');

    return {
        client,
        user: authData.user
    };
};

export const createTestList = async (client: SupabaseClient, userId: string) => {
    const id = crypto.randomUUID();
    const {error} = await client
        .from('shopping_lists')
        .insert({
            id,
            title: 'Test List ' + Date.now(),
            owner_id: userId,
            transport_capacity_g: 5000,
            status: 'draft',
        });

    if (error) throw error;
    return {id};
};

export async function insertListCollaborator(params: {
    listId: string;
    userId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
}) {
    const adminClient = createAdminClient();
    const {error} = await adminClient
        .from('shopping_list_collaborators')
        .insert({
            list_id: params.listId,
            user_id: params.userId,
            role: params.role,
        });

    if (error) throw error;
}

export function getSupabaseIntegrationFailureSkipReason(error: unknown): string | null {
    const message = error instanceof Error ? error.message : String(error);
    const status = readErrorStatus(error);

    if (status === 401 || message.includes('Unauthorized')) {
        return (
            'Skipping Supabase integration tests: SUPABASE_SERVICE_ROLE_KEY was rejected by the GoTrue admin API. ' +
            'Use the service role key that belongs to NEXT_PUBLIC_SUPABASE_URL.'
        );
    }

    return null;
}

function getPublicSupabaseEnv(): PublicSupabaseEnv {
    const missing = getMissingPublicEnvNames();

    if (missing.length > 0) {
        throw new Error(`Missing required Supabase environment variables: ${missing.join(', ')}`);
    }

    return {supabaseUrl, supabaseAnonKey};
}

function getIntegrationSupabaseEnv(): Extract<IntegrationSupabaseEnv, {canRun: true}> {
    if (!integrationSupabaseEnv.canRun) {
        throw new Error(integrationSupabaseEnv.reason);
    }

    return integrationSupabaseEnv;
}

function validateIntegrationSupabaseEnv(): IntegrationSupabaseEnv {
    const missing = getMissingPublicEnvNames();

    if (missing.length > 0) {
        return {
            canRun: false,
            reason: `Skipping Supabase integration tests: missing required environment variables: ${missing.join(', ')}.`,
        };
    }

    if (!supabaseServiceKey) {
        return {
            canRun: false,
            reason: 'Skipping Supabase integration tests: SUPABASE_SERVICE_ROLE_KEY is required to create confirmed test users.',
        };
    }

    if (supabaseServiceKey === supabaseAnonKey || readJwtRole(supabaseServiceKey) === 'anon') {
        return {
            canRun: false,
            reason: 'Skipping Supabase integration tests: SUPABASE_SERVICE_ROLE_KEY appears to be an anon key.',
        };
    }

    return {
        canRun: true,
        supabaseUrl,
        supabaseAnonKey,
        supabaseServiceRoleKey: supabaseServiceKey,
    };
}

function getMissingPublicEnvNames(): string[] {
    return [
        ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
        ['NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey],
    ]
        .filter(([, value]) => value === '')
        .map(([name]) => name);
}

function readJwtRole(token: string): string | null {
    const [, payload] = token.split('.');

    if (!payload) return null;

    try {
        const parsed: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

        if (typeof parsed !== 'object' || parsed === null || !('role' in parsed)) {
            return null;
        }

        const role = parsed.role;
        return typeof role === 'string' ? role : null;
    } catch {
        return null;
    }
}

function readErrorStatus(error: unknown): number | null {
    if (typeof error !== 'object' || error === null || !('status' in error)) {
        return null;
    }

    const status = error.status;
    return typeof status === 'number' ? status : null;
}

function createTestStorageKey(): string {
    return `preyo-test-${crypto.randomUUID()}`;
}
