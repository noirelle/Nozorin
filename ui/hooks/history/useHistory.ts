'use client';

import { useHistoryState } from './useHistoryState';
import { useHistoryActions } from './useHistoryActions';
import { useHistoryListeners } from './useHistoryListeners';

export type { SessionRecord, HistoryStats } from './useHistoryState';

export const useHistory = (visitorToken: string | null, onUnauthorized?: () => void) => {
    const state = useHistoryState(onUnauthorized);
    const actions = useHistoryActions({
        visitorToken,
        setError: state.setError,
        setIsLoading: state.setIsLoading,
    });
    useHistoryListeners({
        setHistory: state.setHistory,
        setStats: state.setStats,
        setIsLoading: state.setIsLoading,
        setError: state.setError,
        onUnauthorizedRef: state.onUnauthorizedRef,
    });

    return {
        history: state.history,
        stats: state.stats,
        isLoading: state.isLoading,
        error: state.error,
        fetchHistory: actions.fetchHistory,
        fetchStats: actions.fetchStats,
        clearHistory: actions.clearHistory,
        trackSessionStart: actions.trackSessionStart,
        trackSessionEnd: actions.trackSessionEnd,
    };
};
