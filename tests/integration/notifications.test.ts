import {beforeAll, describe, expect, it, type TestContext} from 'vitest';
import type {SupabaseClient, User} from '@supabase/supabase-js';
import {
    canRunSupabaseIntegrationTests,
    createTestUser,
    getSupabaseIntegrationFailureSkipReason,
    supabaseIntegrationSkipReason,
} from '../utils/supabase';

const uuid = () => crypto.randomUUID();
const describeIntegration = canRunSupabaseIntegrationTests ? describe : describe.skip;

type Setup = {
    client: SupabaseClient;
    user: User;
};

type NotificationRow = {
    id: string;
    invite_token_id: string | null;
    list_id: string | null;
    read_at: string | null;
    resolved_at: string | null;
    title: string;
    type: string;
};

if (supabaseIntegrationSkipReason) console.warn(supabaseIntegrationSkipReason);

describeIntegration('Notifications', () => {
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

    it('invitar a un usuario registrado crea una notificación real al invitado', async (context) => {
        const owner = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!owner) return;

        const invited = await createTestUser();
        const listId = await createList(owner.client, 'Compra semanal');

        const {error} = await owner.client.rpc('cl_generate_invite_token', {
            p_list_id: listId,
            p_email: invited.user.email,
            p_role: 'VIEWER',
            p_can_invite: false,
        });

        expect(error).toBeNull();

        const notifications = await getNotifications(invited.client);
        const inviteNotification = notifications.find((notification) => notification.type === 'list_invite_received');

        expect(inviteNotification).toMatchObject({
            list_id: listId,
            read_at: null,
            resolved_at: null,
        });
        expect(inviteNotification?.title).toContain('te invitó');
        expect(inviteNotification?.invite_token_id).toBeTruthy();
    });

    it('aceptar invitación resuelve la notificación y notifica al invitador', async (context) => {
        const owner = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!owner) return;

        const invited = await createTestUser();
        const listId = await createList(owner.client, 'Lista para aceptar');
        const notification = await inviteAndGetNotification(owner.client, invited, listId);

        const {error: acceptError} = await invited.client.rpc('cl_accept_invite_by_id', {
            p_invite_id: notification.invite_token_id,
        });

        expect(acceptError).toBeNull();

        const invitedNotifications = await getNotifications(invited.client);
        const resolved = invitedNotifications.find((candidate) => candidate.id === notification.id);
        expect(resolved?.read_at).not.toBeNull();
        expect(resolved?.resolved_at).not.toBeNull();

        const ownerNotifications = await getNotifications(owner.client);
        expect(ownerNotifications.some((candidate) =>
            candidate.type === 'list_invite_accepted' && candidate.list_id === listId,
        )).toBe(true);
    });

    it('rechazar invitación resuelve la notificación y notifica al invitador', async (context) => {
        const owner = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!owner) return;

        const invited = await createTestUser();
        const listId = await createList(owner.client, 'Lista para rechazar');
        const notification = await inviteAndGetNotification(owner.client, invited, listId);

        const {error: rejectError} = await invited.client.rpc('cl_reject_invite_by_id', {
            p_invite_id: notification.invite_token_id,
        });

        expect(rejectError).toBeNull();

        const invitedNotifications = await getNotifications(invited.client);
        const resolved = invitedNotifications.find((candidate) => candidate.id === notification.id);
        expect(resolved?.read_at).not.toBeNull();
        expect(resolved?.resolved_at).not.toBeNull();

        const ownerNotifications = await getNotifications(owner.client);
        expect(ownerNotifications.some((candidate) =>
            candidate.type === 'list_invite_rejected' && candidate.list_id === listId,
        )).toBe(true);
    });

    it('un usuario no puede leer ni marcar notificaciones de otro usuario', async (context) => {
        const owner = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!owner) return;

        const invited = await createTestUser();
        const stranger = await createTestUser();
        const listId = await createList(owner.client, 'Lista privada');
        const notification = await inviteAndGetNotification(owner.client, invited, listId);

        const {data: hiddenRows, error: selectError} = await stranger.client
            .from('notifications')
            .select('id')
            .eq('id', notification.id);

        expect(selectError).toBeNull();
        expect(hiddenRows).toHaveLength(0);

        const {error: markError} = await stranger.client.rpc('notifications_mark_read', {
            p_notification_id: notification.id,
        });

        expect(markError?.message).toContain('NOT_FOUND');
    });

    it('no duplica notificaciones cuando la invitación ya está pendiente', async (context) => {
        const owner = getSetupOrSkip(context, setup, dynamicSkipReason);
        if (!owner) return;

        const invited = await createTestUser();
        const listId = await createList(owner.client, 'Lista sin duplicados');

        await inviteAndGetNotification(owner.client, invited, listId);

        const {error: duplicatedError} = await owner.client.rpc('cl_generate_invite_token', {
            p_list_id: listId,
            p_email: invited.user.email,
            p_role: 'VIEWER',
            p_can_invite: false,
        });

        expect(duplicatedError?.message).toContain('INVITE_PENDING');

        const notifications = await getNotifications(invited.client);
        expect(notifications.filter((notification) =>
            notification.type === 'list_invite_received' && notification.list_id === listId,
        )).toHaveLength(1);
    });
});

async function createList(client: SupabaseClient, title: string) {
    const listId = uuid();
    const {error} = await client.rpc('cl_create_list', {
        p_command_id: uuid(),
        p_list_id: listId,
        p_title: title,
        p_transport_capacity_g: 5000,
    });

    if (error) throw error;
    return listId;
}

async function inviteAndGetNotification(ownerClient: SupabaseClient, invited: Setup, listId: string) {
    const {error} = await ownerClient.rpc('cl_generate_invite_token', {
        p_list_id: listId,
        p_email: invited.user.email,
        p_role: 'VIEWER',
        p_can_invite: false,
    });

    if (error) throw error;

    const notification = (await getNotifications(invited.client)).find((candidate) =>
        candidate.type === 'list_invite_received' && candidate.list_id === listId,
    );

    if (!notification?.invite_token_id) throw new Error('Expected invitation notification with invite id');
    return notification;
}

async function getNotifications(client: SupabaseClient): Promise<NotificationRow[]> {
    const {data, error} = await client.rpc('notifications_get_my_recent', {p_limit: 20});
    if (error) throw error;
    return (data ?? []) as NotificationRow[];
}

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
