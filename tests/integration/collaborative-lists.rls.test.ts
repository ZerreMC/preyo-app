import {beforeAll, describe, expect, it, type TestContext} from 'vitest';
import {
    canRunSupabaseIntegrationTests,
    createTestList,
    createTestUser,
    getSupabaseIntegrationFailureSkipReason,
    insertListCollaborator,
    supabaseIntegrationSkipReason,
} from '../utils/supabase';
import type {SupabaseClient, User} from '@supabase/supabase-js';

const uuid = () => crypto.randomUUID();
const describeIntegration = canRunSupabaseIntegrationTests ? describe : describe.skip;

type Setup = {
    client: SupabaseClient;
    user: User;
};

if (supabaseIntegrationSkipReason) console.warn(supabaseIntegrationSkipReason);

describeIntegration('Collaborative Lists RLS', () => {
    let setup: Setup | null = null;
    let dynamicSkipReason: string | null = null;

    beforeAll(async () => {
        try {
            setup = await createTestUser();
        } catch (error) {
            const skipReason = getSupabaseIntegrationFailureSkipReason(error);
            if (!skipReason) throw error;
            dynamicSkipReason = skipReason;
            console.warn(skipReason);
        }
    });

    it('non-member cannot view and viewer cannot edit', async (context) => {
        const owner = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!owner) return;

        const viewer = await createTestUser();
        const stranger = await createTestUser();
        const list = await createTestList(owner.client, owner.user.id);

        const {data: hidden} = await stranger.client
            .from('shopping_lists')
            .select('id')
            .eq('id', list.id)
            .maybeSingle();
        expect(hidden).toBeNull();

        await insertListCollaborator({listId: list.id, userId: viewer.user.id, role: 'VIEWER'});

        const {error} = await viewer.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: uuid(),
            p_product_ref: uuid(),
            p_name: 'Forbidden',
            p_quantity: null,
            p_estimated_weight_g: 100,
        });

        expect(error?.message).toContain('FORBIDDEN');
    });

    it('only owner can delete lists and add collaborators', async (context) => {
        const owner = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!owner) return;

        const editor = await createTestUser();
        const target = await createTestUser();
        const list = await createTestList(owner.client, owner.user.id);

        await insertListCollaborator({listId: list.id, userId: editor.user.id, role: 'EDITOR'});

        const {error: addError} = await editor.client.rpc('cl_add_collaborator_by_email', {
            p_list_id: list.id,
            p_email: target.user.email ?? '',
            p_role: 'VIEWER',
        });
        expect(addError?.message).toContain('FORBIDDEN');

        const {error: deleteError} = await editor.client.rpc('cl_delete_list', {
            p_command_id: uuid(),
            p_list_id: list.id,
        });
        expect(deleteError?.message).toContain('FORBIDDEN');
    });
});

function getSetupOrSkip(context: TestContext, setup: Setup | null, dynamicSkipReason: string | null): Setup | null {
    if (dynamicSkipReason) {
        context.skip();
        return null;
    }

    if (!setup) {
        context.skip();
        return null;
    }

    return setup;
}
