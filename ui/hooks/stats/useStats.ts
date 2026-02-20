'use client';

import { useStatsState } from './useStatsState';
import { useStatsListeners } from './useStatsListeners';

export function useStats() {
    const state = useStatsState();
    useStatsListeners({
        setStats: state.setStats,
        setIsLoading: state.setIsLoading,
        setError: state.setError,
    });

    return {
        stats: state.stats,
        isLoading: state.isLoading,
        error: state.error,
    };
}
