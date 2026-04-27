import {describe, it, expect, beforeAll, type TestContext} from 'vitest';
import {
    canRunSupabaseIntegrationTests,
    createTestList,
    createTestUser,
    getSupabaseIntegrationFailureSkipReason,
    insertListCollaborator,
    supabaseIntegrationSkipReason,
} from '../utils/supabase';
import {getCollaborativeList, type Uuid} from '../../src/features/collaborative-lists';
import type {SupabaseClient, User} from '@supabase/supabase-js';

const uuid = () => crypto.randomUUID() as Uuid;
const describeIntegration = canRunSupabaseIntegrationTests ? describe : describe.skip;

type RpcTestSetup = {
    client: SupabaseClient;
    user: User;
};

if (supabaseIntegrationSkipReason) {
    console.warn(supabaseIntegrationSkipReason);
}

describeIntegration('Collaborative Lists RPC', () => {
    let setup: RpcTestSetup | null = null;
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

    it('cl_add_item inserta', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const list = await createTestList(current.client, current.user.id);
        const itemId = uuid();

        const {error} = await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_product_ref: 'PROD-1',
            p_name: 'Apple',
            p_quantity: '1 kg',
            p_estimated_weight_g: 1000
        });

        expect(error).toBeNull();

        const updatedList = await getCollaborativeList(current.client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(1);
        expect(updatedList?.items[0].id).toBe(itemId);
    });

    it('retry (idempotencia) no rompe', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const list = await createTestList(current.client, current.user.id);
        const itemId = uuid();
        const commandId = uuid();

        const payload = {
            p_command_id: commandId,
            p_list_id: list.id,
            p_item_id: itemId,
            p_product_ref: 'PROD-2',
            p_name: 'Banana',
            p_quantity: '2',
            p_estimated_weight_g: 200
        };

        const {error: error1} = await current.client.rpc('cl_add_item', payload);
        expect(error1).toBeNull();

        const {error: error2} = await current.client.rpc('cl_add_item', payload);
        expect(error2).toBeNull();

        const updatedList = await getCollaborativeList(current.client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(1);
    });

    it('cl_remove_item elimina', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const list = await createTestList(current.client, current.user.id);
        const itemId = uuid();

        await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_product_ref: 'PROD-3',
            p_name: 'Orange',
            p_quantity: '3',
            p_estimated_weight_g: 300
        });

        const {error} = await current.client.rpc('cl_remove_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId
        });

        expect(error).toBeNull();

        const updatedList = await getCollaborativeList(current.client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(0);
    });

    it('cl_toggle_item cambia estado', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const list = await createTestList(current.client, current.user.id);
        const itemId = uuid();

        await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_product_ref: 'PROD-4',
            p_name: 'Milk',
            p_quantity: '1L',
            p_estimated_weight_g: 1000
        });

        const {error} = await current.client.rpc('cl_toggle_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_checked: true
        });

        expect(error).toBeNull();

        const updatedList = await getCollaborativeList(current.client, list.id as Uuid);
        expect(updatedList?.items[0].checked).toBe(true);
    });

    it('error al superar capacidad', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const list = await createTestList(current.client, current.user.id);

        const {error} = await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: uuid(),
            p_product_ref: 'HEAVY',
            p_name: 'Iron Weights',
            p_quantity: '1',
            p_estimated_weight_g: 6000
        });

        expect(error).not.toBeNull();
        expect(error?.message).toContain('CAPACITY_EXCEEDED');
    });

    it('error duplicado no inserta dos veces', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const list = await createTestList(current.client, current.user.id);
        const ref = 'SAME_PROD';

        const {error: error1} = await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: uuid(),
            p_product_ref: ref,
            p_name: 'First',
            p_quantity: '1',
            p_estimated_weight_g: 100
        });
        expect(error1).toBeNull();

        const {error: error2} = await current.client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: uuid(),
            p_product_ref: ref,
            p_name: 'Second',
            p_quantity: '2',
            p_estimated_weight_g: 200
        });

        expect(error2).not.toBeNull();
        expect(error2?.message).toContain('DUPLICATE_PRODUCT');

        const updatedList = await getCollaborativeList(current.client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(1);
    });
    it('mantiene consistencia bajo concurrencia real entre dos clientes', async (context) => {
        if (!getSetupOrSkip(context, setup, dynamicSkipReason)) return;

        const ownerSetup = await createTestUser();
        const collaboratorSetup = await createTestUser();

        const ownerClient = ownerSetup.client;
        const ownerUser = ownerSetup.user;
        const collaboratorClient = collaboratorSetup.client;
        const collaboratorUser = collaboratorSetup.user;

        const list = await createTestList(ownerClient, ownerUser.id);
        const ref = 'CONCURRENT-PROD';

        await insertListCollaborator({
            listId: list.id,
            userId: collaboratorUser.id,
            role: 'EDITOR',
        });

        const results = await Promise.allSettled([
            ownerClient.rpc('cl_add_item', {
                p_command_id: uuid(),
                p_list_id: list.id,
                p_item_id: uuid(),
                p_product_ref: ref,
                p_name: 'Owner item',
                p_quantity: '1',
                p_estimated_weight_g: 100,
            }),
            collaboratorClient.rpc('cl_add_item', {
                p_command_id: uuid(),
                p_list_id: list.id,
                p_item_id: uuid(),
                p_product_ref: ref,
                p_name: 'Collaborator item',
                p_quantity: '1',
                p_estimated_weight_g: 100,
            }),
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('fulfilled');

        const fulfilledResults = results.filter(
            (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof ownerClient.rpc>>> =>
                result.status === 'fulfilled',
        );

        const settledValues = fulfilledResults.map((result) => result.value);
        const successCount = settledValues.filter((result) => result.error === null).length;
        const duplicateErrors = settledValues.filter((result) =>
            result.error?.message?.includes('DUPLICATE_PRODUCT'),
        );

        expect(successCount).toBe(1);
        expect(duplicateErrors).toHaveLength(1);

        const updatedList = await getCollaborativeList(ownerClient, list.id as Uuid);
        const matchingItems = updatedList?.items.filter((item: { productRef: string }) => item.productRef === ref) ?? [];

        expect(matchingItems).toHaveLength(1);
    });
});

function getSetupOrSkip(
    context: TestContext,
    setup: RpcTestSetup | null,
    skipReason: string | null,
): RpcTestSetup | null {
    if (skipReason) {
        context.skip(skipReason);
        return null;
    }

    if (!setup) throw new Error('Supabase integration test setup did not run');

    return setup;
}
