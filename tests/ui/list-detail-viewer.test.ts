import React from 'react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import {ListDetailPageClient} from '../../src/features/collaborative-lists';

afterEach(() => cleanup());

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({push: vi.fn()}),
}));

// Mock Supabase browser client
vi.mock('@/shared/api/supabase/browserClient', () => ({
    createClient: () => ({
        auth: {
            getSession: vi.fn().mockResolvedValue({data: {session: {access_token: 'tok'}}}),
            getUser: vi.fn().mockResolvedValue({data: {user: {id: 'viewer-uuid'}}}),
        },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            returns: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    id: 'list-1',
                    owner_id: 'owner-uuid',
                    title: 'Mi Lista',
                    status: 'active',
                    transport_capacity_g: 5000,
                    last_command_id: null,
                    last_command_at: null,
                    items: [],
                    collaborators: [{user_id: 'viewer-uuid', role: 'VIEWER'}],
                },
                error: null,
            }),
        }),
        channel: vi.fn().mockImplementation(() => {
            const ch: Record<string, unknown> = {
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn().mockImplementation((cb?: (status: string) => void) => {
                    cb?.('SUBSCRIBED');
                    return ch;
                }),
            };
            return ch;
        }),
        removeChannel: vi.fn(),
        realtime: {setAuth: vi.fn()},
    }),
}));

describe('ListDetailPageClient — VIEWER permissions', () => {
    it('shows read-only banner for VIEWER role', async () => {
        render(React.createElement(ListDetailPageClient, {listId: 'list-1'}));
        // Wait for async state
        await screen.findByText('Mi Lista');
        expect(screen.getByText(/solo lectura/i)).toBeTruthy();
    });

    it('hides the add-product form for VIEWER role', async () => {
        render(React.createElement(ListDetailPageClient, {listId: 'list-1'}));
        await screen.findByText('Mi Lista');
        expect(screen.queryByLabelText(/producto/i)).toBeNull();
        expect(screen.queryByText(/añadir producto/i)).toBeNull();
    });
});
