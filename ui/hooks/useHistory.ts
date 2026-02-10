'use client';

import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export interface SessionRecord {
    sessionId: string;
    partnerId: string;
    country: string;
    countryCode: string;
    partnerCountry?: string;
    partnerCountryCode?: string;
    connectionTime: number;
    disconnectionTime?: number;
    duration?: number; // in seconds
    disconnectReason?: 'user-action' | 'partner-disconnect' | 'error' | 'skip' | 'network' | 'answered-another';
    mode: 'chat' | 'video';
    partnerStatus?: {
        isOnline: boolean;
        lastSeen: number;
    };
}

export interface HistoryStats {
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
    countriesConnected: string[];
}

export const useHistory = (socket: Socket | null, visitorToken: string | null, onUnauthorized?: () => void) => {
    const [history, setHistory] = useState<SessionRecord[]>([]);
    const [stats, setStats] = useState<HistoryStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch history
    const fetchHistory = useCallback((limit: number = 20) => {
        if (!socket || !visitorToken) {
            setError('Socket or token not available');
            return;
        }

        setIsLoading(true);
        setError(null);

        socket.emit('get-history', { token: visitorToken, limit });
    }, [socket, visitorToken]);

    // Fetch stats
    const fetchStats = useCallback(() => {
        if (!socket || !visitorToken) {
            setError('Socket or token not available');
            return;
        }

        socket.emit('get-history-stats', { token: visitorToken });
    }, [socket, visitorToken]);

    // Clear history
    const clearHistory = useCallback(() => {
        if (!socket || !visitorToken) {
            setError('Socket or token not available');
            return;
        }

        socket.emit('clear-history', { token: visitorToken });
    }, [socket, visitorToken]);

    // Track session start
    const trackSessionStart = useCallback((partnerId: string, mode: 'chat' | 'video') => {
        if (!socket || !visitorToken) {
            console.warn('[HISTORY] Cannot track session start - missing socket or token');
            return;
        }

        socket.emit('match-established', {
            token: visitorToken,
            partnerId,
            mode,
        });

        console.log('[HISTORY] Session start tracked');
    }, [socket, visitorToken]);

    // Track session end
    const trackSessionEnd = useCallback((reason?: SessionRecord['disconnectReason']) => {
        if (!socket || !visitorToken) {
            console.warn('[HISTORY] Cannot track session end - missing socket or token');
            return;
        }

        socket.emit('session-end', {
            token: visitorToken,
            reason,
        });

        console.log('[HISTORY] Session end tracked, reason:', reason || 'user-action');
    }, [socket, visitorToken]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleHistoryData = (data: { history: SessionRecord[] }) => {
            setHistory(data.history);
            setIsLoading(false);

            // Watch these partners for status changes
            const partnerIds = [...new Set(data.history.map(s => s.partnerId).filter(id => id && id !== 'unknown'))];
            if (partnerIds.length > 0) {
                socket.emit('watch-user-status', { userIds: partnerIds });
            }

            console.log('[HISTORY] Received history:', data.history.length, 'sessions');
        };

        const handlePartnerStatusChange = (data: { userId: string, status: { isOnline: boolean, lastSeen: number } }) => {
            const { userId, status } = data;
            setHistory(prev => prev.map(session =>
                session.partnerId === userId
                    ? { ...session, partnerStatus: status }
                    : session
            ));
            // console.log(`[HISTORY] Partner ${userId.substring(0, 8)} status changed:`, status.isOnline ? 'ONLINE' : 'OFFLINE');
        };

        const handleHistoryStats = (data: HistoryStats) => {
            setStats(data);
            console.log('[HISTORY] Received stats:', data);
        };

        const handleHistoryCleared = () => {
            setHistory([]);
            setStats(null);
            console.log('[HISTORY] History cleared');
        };

        const handleHistoryError = (data: { message: string }) => {
            const isUnauthorized = data.message === 'Invalid token';

            // Only show error UI for non-auth errors
            if (!isUnauthorized) {
                setError(data.message);
                setIsLoading(false);
            }

            console.error('[HISTORY] Error:', data.message);

            // If token is invalid, trigger regeneration silently
            if (isUnauthorized && onUnauthorized) {
                console.warn('[HISTORY] Unauthorized access, refreshing token...');
                onUnauthorized();
            }
        };

        socket.on('history-data', handleHistoryData);
        socket.on('partner-status-change', handlePartnerStatusChange);
        socket.on('history-stats', handleHistoryStats);
        socket.on('history-cleared', handleHistoryCleared);
        socket.on('history-error', handleHistoryError);
        socket.on('history-stats-error', handleHistoryError);
        socket.on('history-clear-error', handleHistoryError);

        // If we were waiting for a new token, retry once it's available
        if (visitorToken && isLoading && !error) {
            socket.emit('get-history', { token: visitorToken, limit: 20 });
            socket.emit('get-history-stats', { token: visitorToken });
        }

        return () => {
            socket.off('history-data', handleHistoryData);
            socket.off('partner-status-change', handlePartnerStatusChange);
            socket.off('history-stats', handleHistoryStats);
            socket.off('history-cleared', handleHistoryCleared);
            socket.off('history-error', handleHistoryError);
            socket.off('history-stats-error', handleHistoryError);
            socket.off('history-clear-error', handleHistoryError);
        };
    }, [socket, visitorToken, isLoading, error, onUnauthorized]);

    return {
        history,
        stats,
        isLoading,
        error,
        fetchHistory,
        fetchStats,
        clearHistory,
        trackSessionStart,
        trackSessionEnd,
    };
};
