'use client';

import { useCallback, useEffect } from 'react';
import { getSocketClient, connectSocket, useSocketEvent } from '../../lib/socket';
import { SocketEvents, StatsUpdatePayload } from '../../lib/socket';
import { UseStatsStateReturn } from './useStatsState';

interface UseStatsListenersProps {
    setStats: UseStatsStateReturn['setStats'];
    setIsLoading: UseStatsStateReturn['setIsLoading'];
    setError: UseStatsStateReturn['setError'];
}

export const useStatsListeners = ({ setStats, setIsLoading, setError }: UseStatsListenersProps) => {
    // Ensure socket is connected when this hook mounts
    useEffect(() => {
        const socket = getSocketClient();
        if (!socket) return;
        if (!socket.connected) connectSocket();
        // Optimistically set loading to false if already connected, otherwise wait for events/connect
        if (socket.connected) setIsLoading(false);
    }, [setIsLoading]);

    const handleStatsUpdate = useCallback((data: StatsUpdatePayload) => {
        setStats(data);
        setIsLoading(false);
    }, [setStats, setIsLoading]);

    const handleConnectError = useCallback((err: Error) => {
        console.error('[STATS] Connection error:', err);
        setError(err);
        setIsLoading(false);
    }, [setError, setIsLoading]);

    useSocketEvent<StatsUpdatePayload>(SocketEvents.STATS_UPDATE, handleStatsUpdate);
    useSocketEvent<Error>(SocketEvents.CONNECT_ERROR, handleConnectError);
};
