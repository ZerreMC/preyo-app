import {beforeAll, describe, expect, it, type TestContext} from 'vitest';
import {SupabaseListRepository, type Uuid} from '../../src/features/collaborative-lists';
import {
    canRunSupabaseIntegrationTests,
    createTestUser,
    getSupabaseIntegrationFailureSkipReason,
    supabaseIntegrationSkipReason,
} from '../utils/supabase';
import type {SupabaseClient, User} from '@supabase/supabase-js';

const uuid = () => crypto.randomUUID() as Uuid;
const describeIntegration = canRunSupabaseIntegrationTests ? describe : describe.skip;

type Setup = {
    client: SupabaseClient;
    user: User;
};

if (supabaseIntegrationSkipReason) console.warn(supabaseIntegrationSkipReason);

describeIntegration('Collaborative Lists commands', () => {
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

    it('createList, renameList and deleteList work through repository RPCs', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const repository = new SupabaseListRepository(current.client);
        const listId = uuid();
        const list = await repository.createList({
            commandId: uuid(),
            listId,
            title: 'Integration list',
            transportCapacityG: 5000,
        });

        expect(list.snapshot().title).toBe('Integration list');

        await repository.renameList({commandId: uuid(), listId, title: 'Renamed list'});
        expect((await repository.getList(listId))?.snapshot().title).toBe('Renamed list');

        await repository.deleteList({commandId: uuid(), listId});
        expect(await repository.getList(listId)).toBeNull();
    });

    it('covers item, collaborator and invite token flows', async (context) => {
        const current = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!current) return;

        const collaborator = await createTestUser();
        const repository = new SupabaseListRepository(current.client);
        const collaboratorRepository = new SupabaseListRepository(collaborator.client);
        const listId = uuid();
        const itemId = uuid();

        await repository.createList({commandId: uuid(), listId, title: 'Flow list', transportCapacityG: 5000});
        await repository.addItem({
            commandId: uuid(),
            listId,
            itemId,
            productRef: uuid(),
            name: 'Manual item',
            quantity: '1 unidad',
            estimatedWeightG: 500,
        });

        await repository.toggleItem({commandId: uuid(), listId, itemId, checked: true});
        expect((await repository.getList(listId))?.snapshot().items[0].checked).toBe(true);

        await collaborator.client
            .from('profiles')
            .update({email_public: true})
            .eq('id', collaborator.user.id);

        await repository.addCollaboratorByEmail(listId, collaborator.user.email ?? '', 'EDITOR');
        expect(await collaboratorRepository.getList(listId)).not.toBeNull();

        await repository.removeCollaborator(listId, collaborator.user.id as Uuid);
        expect(await collaboratorRepository.getList(listId)).toBeNull();

        const token = await repository.generateInviteToken(listId);
        const acceptedListId = await collaboratorRepository.acceptInvite(token as Uuid);
        expect(acceptedListId).toBe(listId);
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
