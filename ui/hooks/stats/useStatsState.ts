'use client';

import { useState } from 'react';
import { StatsUpdatePayload } from '../../lib/socket';

export interface StatsData {
    people_online: number;
    matches_today: number;
    total_connections: number;
    isConnected: boolean;
}

export const useStatsState = () => {
    const [stats, setStats] = useState<StatsData>({
        people_online: 0,
        matches_today: 0,
        total_connections: 0,
        isConnected: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    return {
        stats,
        isLoading,
        error,
        setStats,
        setIsLoading,
        setError,
    };
};

export type UseStatsStateReturn = ReturnType<typeof useStatsState>;
