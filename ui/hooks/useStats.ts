'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Stats {
    peopleOnline: number;
    dailyChats: number;
    totalConnections: number;
}

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useStats() {
    const [stats, setStats] = useState<Stats>({
        peopleOnline: 0,
        dailyChats: 0,
        totalConnections: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let socket: Socket | null = null;

        try {
            // Connect to socket
            socket = io(API_URL, {
                transports: ['websocket', 'polling'],
            });

            socket.on('connect', () => {
                console.log('[STATS] Connected to stats socket');
                setError(null);
            });

            // Listen for stats updates
            socket.on('stats-update', (data: Stats) => {
                setStats(data);
                setIsLoading(false);
            });

            socket.on('connect_error', (err) => {
                console.error('[STATS] Connection error:', err);
                setError(err as Error);
                setIsLoading(false);
            });

        } catch (err) {
            console.error('[STATS] Error setting up socket:', err);
            setError(err as Error);
            setIsLoading(false);
        }

        return () => {
            if (socket) {
                socket.off('stats-update');
                socket.disconnect();
            }
        };
    }, []);

    return { stats, isLoading, error };
}
