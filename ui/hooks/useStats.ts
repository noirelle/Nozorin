'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocketClient, connectSocket, useSocketEvent } from '../lib/socket';
import { SocketEvents, StatsUpdatePayload } from '../lib/socket';

interface Stats {
    peopleOnline: number;
    matchesToday: number;
    totalConnections: number;
}

export function useStats() {
    const [stats, setStats] = useState<Stats>({
        peopleOnline: 0,
        matchesToday: 0,
        totalConnections: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Ensure socket is connected when this hook mounts
    useEffect(() => {
        const socket = getSocketClient();
        if (!socket) return;
        if (!socket.connected) connectSocket();
        if (socket.connected) setIsLoading(false);
    }, []);

    const handleStatsUpdate = useCallback((data: StatsUpdatePayload) => {
        setStats(data);
        setIsLoading(false);
    }, []);

    const handleConnectError = useCallback((err: Error) => {
        console.error('[STATS] Connection error:', err);
        setError(err);
        setIsLoading(false);
    }, []);

    useSocketEvent<StatsUpdatePayload>(SocketEvents.STATS_UPDATE, handleStatsUpdate);
    useSocketEvent<Error>(SocketEvents.CONNECT_ERROR, handleConnectError);

    return { stats, isLoading, error };
}
