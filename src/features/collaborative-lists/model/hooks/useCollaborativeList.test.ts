import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useCollaborativeList} from './useCollaborativeList';
import * as getCollaborativeListModule from '../queries/getCollaborativeList';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {DomainUuid} from '../../domain/ShoppingList';
import type {CollaborativeListReadModel} from '../queries/getCollaborativeList';

type SubscribeCallback = NonNullable<Parameters<ReturnType<SupabaseClient['channel']>['subscribe']>[0]>;
type SubscribeStatus = Parameters<SubscribeCallback>[0];

const realtimeStatus = {
    subscribed: 'SUBSCRIBED' as SubscribeStatus,
    channelError: 'CHANNEL_ERROR' as SubscribeStatus,
    timedOut: 'TIMED_OUT' as SubscribeStatus,
};

vi.mock('../queries/getCollaborativeList', () => ({
    getCollaborativeList: vi.fn(),
}));

describe('useCollaborativeList', () => {
    let mockSupabase: SupabaseClient;
    let mockChannel: ReturnType<SupabaseClient['channel']>;
    const listId = DomainUuid.new();

    beforeEach(() => {
        mockSupabase = createClient('http://127.0.0.1:54321', 'test-anon-key', {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                storageKey: `preyo-hook-test-${crypto.randomUUID()}`,
            },
        });
        mockChannel = mockSupabase.channel('mock-channel');

        vi.spyOn(mockSupabase.auth, 'getSession').mockResolvedValue({data: {session: null}, error: null});
        vi.spyOn(mockSupabase.realtime, 'setAuth').mockResolvedValue(undefined);
        vi.spyOn(mockChannel, 'on').mockReturnValue(mockChannel);
        vi.spyOn(mockChannel, 'subscribe').mockImplementation((callback) => {
            callback?.(realtimeStatus.subscribed, undefined);
            return mockChannel;
        });
        vi.spyOn(mockSupabase, 'channel').mockReturnValue(mockChannel);
        vi.spyOn(mockSupabase, 'removeChannel').mockResolvedValue('ok');
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
        const mockList = createCollaborativeListReadModel({id: listId, title: 'My list'});
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(mockList);

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
        const mockList1 = createCollaborativeListReadModel({id: listId, title: 'My list'});
        const mockList2 = createCollaborativeListReadModel({id: listId, title: 'Updated list'});
 
        const getListSpy = vi.spyOn(getCollaborativeListModule, 'getCollaborativeList')
            .mockResolvedValueOnce(mockList1)
            .mockResolvedValueOnce(mockList2);

        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result.current.list).toEqual(mockList1));

        const broadcastCallback = vi.mocked(mockChannel.on).mock.calls.find(
            (call: unknown[]) => call[0] === 'broadcast' && isBroadcastFilter(call[1], 'UPDATE'),
        )?.[2];

        if (typeof broadcastCallback !== 'function') {
            throw new Error('Expected UPDATE broadcast callback to be registered');
        }

        broadcastCallback({});

        await waitFor(() => expect(result.current.list).toEqual(mockList2));
        expect(getListSpy).toHaveBeenCalledTimes(2);
    });

    it('surfaces CHANNEL_ERROR without wiping an existing list', async () => {
        // A list was already loaded; channel then fails
        const mockList = createCollaborativeListReadModel({id: listId, title: 'Already loaded'});
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(mockList);

        // First render: SUBSCRIBED → happy path
        vi.mocked(mockChannel.subscribe).mockImplementation((callback) => {
            callback?.(realtimeStatus.subscribed, undefined);
            return mockChannel;
        });
 
        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result.current.list).toEqual(mockList));

        // Now simulate a channel error on a fresh hook mount (e.g. reconnect scenario)
        vi.mocked(mockChannel.subscribe).mockImplementation((callback) => {
            callback?.(realtimeStatus.channelError, new Error('Realtime error'));
            return mockChannel;
        });
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(null);

        const {result: result2} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result2.current.isLoading).toBe(false));

        expect(result2.current.error).toBe('Realtime error');
    });

    it('surfaces TIMED_OUT as an error', async () => {
        vi.mocked(mockChannel.subscribe).mockImplementation((callback) => {
            callback?.(realtimeStatus.timedOut);
            return mockChannel;
        });
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(null);

        const {result} = renderHook(() =>
            useCollaborativeList({supabase: mockSupabase, listId}),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe('Realtime timeout');
    });

    it('removes the channel on unmount', async () => {
        vi.spyOn(getCollaborativeListModule, 'getCollaborativeList').mockResolvedValue(
            createCollaborativeListReadModel({id: listId, title: 'Title'}),
        );

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

function createCollaborativeListReadModel(
    overrides: Partial<CollaborativeListReadModel> = {},
): CollaborativeListReadModel {
    return {
        id: DomainUuid.new(),
        ownerId: DomainUuid.new(),
        title: 'Test list',
        status: 'draft',
        transportCapacityG: 10000,
        lastCommandId: null,
        lastCommandAt: null,
        items: [],
        ...overrides,
    };
}

function isBroadcastFilter(value: unknown, event: string): value is {event: string} {
    return (
        typeof value === 'object' &&
        value !== null &&
        'event' in value &&
        value.event === event
    );
}
