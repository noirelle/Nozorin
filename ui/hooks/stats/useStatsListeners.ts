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
        // Optimistically set loading to false if already connected, otherwise wait for events/connect
        if (socket.connected) {
            setIsLoading(false);
            setStats(prev => ({ ...prev, isConnected: true }));
        }

        const onConnect = () => {
            setStats(prev => ({ ...prev, isConnected: true }));
            setIsLoading(false);
        };

        const onDisconnect = () => {
            setStats(prev => ({ ...prev, isConnected: false }));
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on(SocketEvents.IDENTIFY_SUCCESS, onConnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off(SocketEvents.IDENTIFY_SUCCESS, onConnect);
        };
    }, [setIsLoading, setStats]);

    const handleStatsUpdate = useCallback((data: StatsUpdatePayload) => {
        setStats(prev => ({ ...prev, ...data, isConnected: true }));
        setIsLoading(false);
    }, [setStats, setIsLoading]);

    const handleConnectError = useCallback((err: Error) => {
        console.error('[STATS] Connection error:', err);
        setError(err);
        setIsLoading(false);
        setStats(prev => ({ ...prev, isConnected: false }));
    }, [setError, setIsLoading, setStats]);

    useSocketEvent<StatsUpdatePayload>(SocketEvents.STATS_UPDATE, handleStatsUpdate);
    useSocketEvent<Error>(SocketEvents.CONNECT_ERROR, handleConnectError);
};
