'use client';

import { useState } from 'react';
import { StatsUpdatePayload } from '../../lib/socket';

interface Stats {
    peopleOnline: number;
    matchesToday: number;
    totalConnections: number;
}

export const useStatsState = () => {
    const [stats, setStats] = useState<Stats>({
        peopleOnline: 0,
        matchesToday: 0,
        totalConnections: 0,
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
