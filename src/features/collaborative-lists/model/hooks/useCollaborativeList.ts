import {useEffect, useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';

import type {Uuid} from '../../domain/ShoppingList';
import {
    getCollaborativeList,
    type CollaborativeListReadModel,
} from '../queries/getCollaborativeList';

type UseCollaborativeListParams = {
    supabase: SupabaseClient;
    listId: Uuid | null;
};

type UseCollaborativeListState = {
    list: CollaborativeListReadModel | null;
    isLoading: boolean;
    error: string | null;
};

export function useCollaborativeList({
                                         supabase,
                                         listId,
                                     }: UseCollaborativeListParams): UseCollaborativeListState {
    // Avoid isLoading:true flash when listId is null on first render
    const [state, setState] = useState<UseCollaborativeListState>(() => ({
        list: null,
        isLoading: listId !== null,
        error: null,
    }));

    useEffect(() => {
        if (!listId) {
            setState({list: null, isLoading: false, error: null});
            return;
        }

        let isMounted = true;
        let channel: ReturnType<SupabaseClient['channel']> | null = null;

        const fetchList = async () => {
            setState((prev: UseCollaborativeListState) => ({...prev, isLoading: true, error: null}));

            try {
                const list = await getCollaborativeList(supabase, listId);
                if (isMounted) setState({list, isLoading: false, error: null});
            } catch (err) {
                if (isMounted) {
                    setState((prev: UseCollaborativeListState) => ({
                        ...prev,
                        isLoading: false,
                        error: err instanceof Error ? err.message : 'Unknown error',
                    }));
                }
            }
        };

        const setup = async () => {
            // 1. Authenticate the realtime connection
            const {data} = await supabase.auth.getSession();
            if (!isMounted) return;

            await supabase.realtime.setAuth(data.session?.access_token ?? null);
            if (!isMounted) return;

            // 2. Subscribe before fetching so we never miss a broadcast that arrives
            //    between the fetch completing and the channel becoming active
            channel = supabase
                .channel(`list:${listId}`, {config: {private: true}})
                .on('broadcast', {event: 'INSERT'}, () => {
                    if (isMounted) void fetchList();
                })
                .on('broadcast', {event: 'UPDATE'}, () => {
                    if (isMounted) void fetchList();
                })
                .on('broadcast', {event: 'DELETE'}, () => {
                    if (isMounted) void fetchList();
                });

            await new Promise<void>((resolve, reject) => {
                channel?.subscribe((status: string, error?: Error) => {
                    if (status === 'SUBSCRIBED') resolve();
                    if (status === 'CHANNEL_ERROR') reject(error instanceof Error ? error : new Error('Realtime error'));
                    if (status === 'TIMED_OUT') reject(new Error('Realtime timeout'));
                });
            });

            if (!isMounted) return;

            // 3. Initial fetch after the channel is ready
            await fetchList();
        };

        setup().catch((err: unknown) => {
            if (isMounted) {
                setState((prev: UseCollaborativeListState) => ({
                    ...prev,
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                }));
            }
        });

        return () => {
            isMounted = false;
            if (channel) void supabase.removeChannel(channel);
        };
    }, [supabase, listId]);

    return state;
}