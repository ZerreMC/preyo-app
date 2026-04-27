import { describe, it, expect, beforeAll, type TestContext } from 'vitest';
import {
    canRunSupabaseIntegrationTests,
    createTestList,
    createTestUser,
    getSupabaseIntegrationFailureSkipReason,
    supabaseIntegrationSkipReason,
} from '../utils/supabase';
import { getCollaborativeList, type Uuid } from '../../src/features/collaborative-lists';
import type { SupabaseClient, User } from '@supabase/supabase-js';

const uuid = () => crypto.randomUUID() as Uuid;
const describeIntegration = canRunSupabaseIntegrationTests ? describe : describe.skip;

type QueryTestSetup = {
    client: SupabaseClient;
    user: User;
    listId: Uuid;
};

if (supabaseIntegrationSkipReason) {
    console.warn(supabaseIntegrationSkipReason);
}

describeIntegration('Collaborative Lists Queries', () => {
    let setup: QueryTestSetup | null = null;
    let dynamicSkipReason: string | null = null;

    beforeAll(async () => {
        try {
            const testSetup = await createTestUser();
            const list = await createTestList(testSetup.client, testSetup.user.id);

            setup = {
                client: testSetup.client,
                user: testSetup.user,
                listId: list.id as Uuid,
            };
        } catch (error) {
            const skipReason = getSupabaseIntegrationFailureSkipReason(error);

            if (!skipReason) throw error;

            dynamicSkipReason = skipReason;
            console.warn(skipReason);
        }
    });

    it('getCollaborativeList devuelve lista + items', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const list = await getCollaborativeList(current.client, current.listId);
        expect(list).not.toBeNull();
        expect(list?.id).toBe(current.listId);
        expect(list?.items).toHaveLength(0);
    });

    it('datos consistentes tras múltiples inserts', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const itemId1 = uuid();
        const itemId2 = uuid();

        await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: current.listId,
            p_item_id: itemId1,
            p_product_ref: 'PROD-A',
            p_name: 'Product A',
            p_quantity: '1',
            p_estimated_weight_g: 100
        });

        await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: current.listId,
            p_item_id: itemId2,
            p_product_ref: 'PROD-B',
            p_name: 'Product B',
            p_quantity: '2',
            p_estimated_weight_g: 200
        });

        const list = await getCollaborativeList(current.client, current.listId);
        expect(list?.items).toHaveLength(2);

        const refs = list?.items.map((i: { productRef: string }) => i.productRef);
        expect(refs).toContain('PROD-A');
        expect(refs).toContain('PROD-B');
    });
});

function getSetupOrSkip(
    context: TestContext,
    setup: QueryTestSetup | null,
    skipReason: string | null,
): QueryTestSetup | null {
    if (skipReason) {
        context.skip(skipReason);
        return null;
    }

    if (!setup) throw new Error('Supabase integration test setup did not run');

    return setup;
}
