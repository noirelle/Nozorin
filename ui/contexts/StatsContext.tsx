'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { getSocketClient } from '@/lib/socket';
import { useStatsState } from '@/hooks/stats/useStatsState';
import { useStatsListeners } from '@/hooks/stats/useStatsListeners';
import { StatsData } from '@/hooks/stats/useStatsState';

interface StatsContextType {
    stats: StatsData;
    isConnected: boolean;
    isLoading: boolean;
    error: Error | null;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
    const state = useStatsState();

    // 1. Global Instant Disconnect on Page Leave
    useEffect(() => {
        const handleBeforeUnload = () => {
            const socket = getSocketClient();
            if (socket) {
                socket.disconnect();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // 2. Attach stats listeners
    useStatsListeners({
        setStats: state.setStats,
        setIsLoading: state.setIsLoading,
        setError: state.setError,
    });

    return (
        <StatsContext.Provider value={{
            stats: state.stats,
            isConnected: state.stats.isConnected,
            isLoading: state.isLoading,
            error: state.error,
        }}>
            {children}
        </StatsContext.Provider>
    );
};

export const useStatsContext = () => {
    const context = useContext(StatsContext);
    if (context === undefined) {
        throw new Error('useStatsContext must be used within a StatsProvider');
    }
    return context;
};
