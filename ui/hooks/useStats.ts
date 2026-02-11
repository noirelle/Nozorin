'use client';

import { useState, useEffect } from 'react';
import { socket as getSharedSocket } from '../lib/socket';

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

    useEffect(() => {
        const socket = getSharedSocket();
        if (!socket) return;

        // Ensure socket is connected if not already
        if (!socket.connected) {
            socket.connect();
        }

        const handleStatsUpdate = (data: Stats) => {
            setStats(data);
            setIsLoading(false);
        };

        const handleConnectError = (err: Error) => {
            console.error('[STATS] Connection error:', err);
            setError(err);
            setIsLoading(false);
        };

        // If already connected, we might have missed the initial stats 
        // but the server emits it on connection or we can wait for the next broadcast
        socket.on('stats-update', handleStatsUpdate);
        socket.on('connect_error', handleConnectError);

        // Fetch initial stats if already connected
        if (socket.connected) {
            // Usually the server sends this on join, but we can't easily trigger it again 
            // without a specific event. However, broadcasts are frequent.
            setIsLoading(false);
        }

        return () => {
            socket.off('stats-update', handleStatsUpdate);
            socket.off('connect_error', handleConnectError);
            // We DON'T disconnect here because other components use this shared socket
        };
    }, []);

    return { stats, isLoading, error };
}
