import { describe, it, expect, beforeAll } from 'vitest';
import { createTestUser, createTestList } from '../utils/supabase';
import { getCollaborativeList, type Uuid } from '../../src/features/collaborative-lists';

const uuid = () => crypto.randomUUID() as Uuid;

describe('Collaborative Lists Queries', () => {
    let client: any;
    let user: any;
    let listId: Uuid;

    beforeAll(async () => {
        const testSetup = await createTestUser();
        client = testSetup.client;
        user = testSetup.user;

        const list = await createTestList(client, user.id);
        listId = list.id as Uuid;
    });

    it('getCollaborativeList devuelve lista + items', async () => {
        const list = await getCollaborativeList(client, listId);
        expect(list).not.toBeNull();
        expect(list?.id).toBe(listId);
        expect(list?.items).toHaveLength(0);
    });

    it('datos consistentes tras múltiples inserts', async () => {
        const itemId1 = uuid();
        const itemId2 = uuid();

        await client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: listId,
            p_item_id: itemId1,
            p_product_ref: 'PROD-A',
            p_name: 'Product A',
            p_quantity: '1',
            p_estimated_weight_g: 100
        });

        await client.rpc('cl_add_item', {
            p_command_id: uuid(),
            p_list_id: listId,
            p_item_id: itemId2,
            p_product_ref: 'PROD-B',
            p_name: 'Product B',
            p_quantity: '2',
            p_estimated_weight_g: 200
        });

        const list = await getCollaborativeList(client, listId);
        expect(list?.items).toHaveLength(2);

        const refs = list?.items.map((i: { productRef: string }) => i.productRef);
        expect(refs).toContain('PROD-A');
        expect(refs).toContain('PROD-B');
    });
});
