import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useCollaborativeList} from './useCollaborativeList';
import * as getCollaborativeListModule from '../queries/getCollaborativeList';
import type {SupabaseClient} from '@supabase/supabase-js';
import {DomainUuid} from '../../domain/ShoppingList';

vi.mock('../queries/getCollaborativeList', () => ({
    getCollaborativeList: vi.fn(),
}));

describe('useCollaborativeList', () => {
    let mockSupabase: SupabaseClient;
    let mockChannel: any;
    const listId = DomainUuid.new();

    beforeEach(() => {
        mockChannel = {
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn((callback: (status: string, error?: Error) => void) => callback('SUBSCRIBED', undefined)),
        };

        mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({data: {session: {access_token: 'token'}}}),
            },
            realtime: {
                setAuth: vi.fn().mockResolvedValue(undefined),
            },
            channel: vi.fn().mockReturnValue(mockChannel),
            removeChannel: vi.fn().mockResolvedValue(undefined),
        } as unknown as SupabaseClient;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns empty state immediately when listId is null', () => {
        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId: null}),
        );

        // Must be synchronous — no loading flash
        expect(result.current).toEqual({list: null, isLoading: false, error: null});
    });

    it('loads the list successfully when listId is provided', async () => {
        const mockList = {id: listId, title: 'My list'};
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(mockList as any);

        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.list).toEqual(mockList);
        expect(result.current.error).toBeNull();
    });

    it('surfaces the error when getCollaborativeList rejects', async () => {
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockRejectedValue(
            new Error('Network error'),
        );

        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.list).toBeNull();
        expect(result.current.error).toBe('Network error');
    });

    it('re-fetches when a broadcast UPDATE arrives', async () => {
        const mockList1 = {id: listId, title: 'My list'};
        const mockList2 = {id: listId, title: 'Updated list'};

        const getListSpy = vi.spyOn(getCollaborativeListModule, 'getCollaborativeList')
            .mockResolvedValueOnce(mockList1 as any)
            .mockResolvedValueOnce(mockList2 as any);

        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result.current.list).toEqual(mockList1));

        const broadcastCallback = mockChannel.on.mock.calls.find(
            (call: any[]) => call[0] === 'broadcast' && call[1].event === 'UPDATE',
        )?.[2];

        broadcastCallback?.();

        await waitFor(() => expect(result.current.list).toEqual(mockList2));
        expect(getListSpy).toHaveBeenCalledTimes(2);
    });

    it('surfaces CHANNEL_ERROR without wiping an existing list', async () => {
        // A list was already loaded; channel then fails
        const mockList = {id: listId, title: 'Already loaded'};
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(mockList as any);

        // First render: SUBSCRIBED → happy path
        mockChannel.subscribe.mockImplementation((callback: any) => callback('SUBSCRIBED', null));

        const {result, rerender} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result.current.list).toEqual(mockList));

        // Now simulate a channel error on a fresh hook mount (e.g. reconnect scenario)
        mockChannel.subscribe.mockImplementation((callback: any) =>
            callback('CHANNEL_ERROR', new Error('Realtime error')),
        );
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(null);

        const {result: result2} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result2.current.isLoading).toBe(false));

        expect(result2.current.error).toBe('Realtime error');
    });

    it('surfaces TIMED_OUT as an error', async () => {
        mockChannel.subscribe.mockImplementation((callback: (status: string, error?: Error) => void) =>
            callback('TIMED_OUT'),
        );
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(null);

        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe('Realtime timeout');
    });

    it('removes the channel on unmount', async () => {
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue({id: listId} as any);

        const {unmount} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() =>
            expect(mockSupabase.channel).toHaveBeenCalledWith(`list:${listId}`, {config: {private: true}}),
        );

        unmount();

        expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
});
