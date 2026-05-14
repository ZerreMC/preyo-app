"use client";

import {useEffect, useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';

import type {Uuid} from '../../domain/ShoppingList';
import {
    getCollaborativeList,
    type CollaborativeListReadModel,
} from '@/features/collaborative-lists';
import type {Database} from '@/shared/api/supabase/types/database.types';

type UseCollaborativeListParams = {
    supabase: SupabaseClient<Database>;
    listId: Uuid | null;
};

type UseCollaborativeListState = {
    list: CollaborativeListReadModel | null;
    currentUserRole: import('../ports/ListRepository').CollaboratorRole | null;
    isLoading: boolean;
    error: string | null;
};

export function useCollaborativeList({
                                         supabase,
                                         listId,
                                     }: UseCollaborativeListParams): UseCollaborativeListState {
    const [state, setState] = useState<UseCollaborativeListState>(() => ({
        list: null,
        currentUserRole: null,
        isLoading: listId !== null,
        error: null,
    }));

    useEffect(() => {
        if (!listId) {
            setState({list: null, currentUserRole: null, isLoading: false, error: null});
            return;
        }

        let isMounted = true;
        let fetchSeq = 0;
        let channel: ReturnType<SupabaseClient['channel']> | null = null;

        const fetchList = async () => {
            const mySeq = ++fetchSeq;
            setState((prev: UseCollaborativeListState) => ({...prev, isLoading: true, error: null}));

            try {
                const list = await getCollaborativeList(supabase, listId);
                if (isMounted && mySeq === fetchSeq) {
                    setState({
                        list,
                        currentUserRole: list?.currentUserRole ?? null,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (err) {
                if (isMounted && mySeq === fetchSeq) {
                    setState((prev: UseCollaborativeListState) => ({
                        ...prev,
                        isLoading: false,
                        error: err instanceof Error ? err.message : 'Unknown error',
                    }));
                }
            }
        };

        const setup = async () => {
            const {data} = await supabase.auth.getSession();
            if (!isMounted) return;

            await supabase.realtime.setAuth(data.session?.access_token ?? null);
            if (!isMounted) return;

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