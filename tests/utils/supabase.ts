import {createClient} from '@supabase/supabase-js';
import {Client} from 'pg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
// Using anon key + signup allows testing RLS properly as a real user
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
}

export const createAuthClient = () => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });
};

export const createTestUser = async () => {
    const client = createAuthClient();
    const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
    const password = 'testpassword123';

    const {data: authData, error: authError} = await client.auth.signUp({
        email,
        password
    });

    if (authError) throw authError;

    // Supabase local dev auto-confirms by default, but we sign in just in case
    await client.auth.signInWithPassword({email, password});

    return {
        client,
        user: authData.user!
    };
};

export const createTestList = async (client: any, userId: string) => {
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
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    });

    await client.connect();

    try {
        await client.query(
            `
                INSERT INTO public.shopping_list_collaborators (list_id, user_id, role)
                VALUES ($1, $2, $3)
            `,
            [params.listId, params.userId, params.role],
        );
    } finally {
        await client.end();
    }
}
