import {describe, it, expect, beforeAll} from 'vitest';
import {createTestUser, createTestList, insertListCollaborator} from '../utils/supabase';
import {getCollaborativeList, type Uuid} from '../../src/features/collaborative-lists';

const uuid = () => crypto.randomUUID() as Uuid;

describe('Collaborative Lists RPC', () => {
    let client: any;
    let user: any;

    beforeAll(async () => {
        const testSetup = await createTestUser();
        client = testSetup.client;
        user = testSetup.user;
    });

    it('cl_add_item inserta', async () => {
        const list = await createTestList(client, user.id);
        const itemId = uuid();

        const {error} = await client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_product_ref: 'PROD-1',
            p_name: 'Apple',
            p_quantity: '1 kg',
            p_estimated_weight_g: 1000
        });

        expect(error).toBeNull();

        const updatedList = await getCollaborativeList(client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(1);
        expect(updatedList?.items[0].id).toBe(itemId);
    });

    it('retry (idempotencia) no rompe', async () => {
        const list = await createTestList(client, user.id);
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

        const {error: error1} = await client.rpc('cl_add_item', payload);
        expect(error1).toBeNull();

        const {error: error2} = await client.rpc('cl_add_item', payload);
        expect(error2).toBeNull();

        const updatedList = await getCollaborativeList(client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(1);
    });

    it('cl_remove_item elimina', async () => {
        const list = await createTestList(client, user.id);
        const itemId = uuid();

        await client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_product_ref: 'PROD-3',
            p_name: 'Orange',
            p_quantity: '3',
            p_estimated_weight_g: 300
        });

        const {error} = await client.rpc('cl_remove_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId
        });

        expect(error).toBeNull();

        const updatedList = await getCollaborativeList(client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(0);
    });

    it('cl_toggle_item cambia estado', async () => {
        const list = await createTestList(client, user.id);
        const itemId = uuid();

        await client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_product_ref: 'PROD-4',
            p_name: 'Milk',
            p_quantity: '1L',
            p_estimated_weight_g: 1000
        });

        const {error} = await client.rpc('cl_toggle_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: itemId,
            p_checked: true
        });

        expect(error).toBeNull();

        const updatedList = await getCollaborativeList(client, list.id as Uuid);
        expect(updatedList?.items[0].checked).toBe(true);
    });

    it('error al superar capacidad', async () => {
        const list = await createTestList(client, user.id);

        const {error} = await client.rpc('cl_add_item', {
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

    it('error duplicado no inserta dos veces', async () => {
        const list = await createTestList(client, user.id);
        const ref = 'SAME_PROD';

        const {error: error1} = await client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: list.id,
            p_item_id: uuid(),
            p_product_ref: ref,
            p_name: 'First',
            p_quantity: '1',
            p_estimated_weight_g: 100
        });
        expect(error1).toBeNull();

        const {error: error2} = await client.rpc('cl_add_item', {
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

        const updatedList = await getCollaborativeList(client, list.id as Uuid);
        expect(updatedList?.items).toHaveLength(1);
    });
    it('mantiene consistencia bajo concurrencia real entre dos clientes', async () => {
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
