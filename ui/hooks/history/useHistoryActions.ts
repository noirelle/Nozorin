'use client';

import { useCallback } from 'react';
import * as historyActions from '../../lib/socket/history/history.actions';
import { SessionRecord } from '../../lib/socket/history/history.types';
import { UseHistoryStateReturn } from './useHistoryState';

interface UseHistoryActionsProps {
    visitorToken: string | null;
    userId: string | undefined;
    setError: UseHistoryStateReturn['setError'];
    setIsLoading: UseHistoryStateReturn['setIsLoading'];
    setHistory: UseHistoryStateReturn['setHistory'];
    setStats: UseHistoryStateReturn['setStats'];
}

export const useHistoryActions = ({ visitorToken, userId, setError, setIsLoading, setHistory, setStats }: UseHistoryActionsProps) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchHistory = useCallback(async (limit: number = 20) => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/session/history/list/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const result = await res.json();
            if (result.status === 'success') {
                setHistory(result.data);
            } else {
                throw new Error(result.message || 'Failed to fetch history');
            }
        } catch (err) {
            setError('Failed to load history');
        } finally {
            setIsLoading(false);
        }
    }, [userId, setError, setIsLoading, setHistory]);

    const fetchStats = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/session/history/stats/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            const result = await res.json();
            if (result.status === 'success') {
                setStats(result.data);
            }
        } catch (err) {
            setError('Failed to load stats');
        }
    }, [userId, setError, setStats]);

    const clearHistory = useCallback(async () => {
        if (!userId) return;
        try {
            await fetch(`/api/session/history/delete/${userId}`, { method: 'DELETE' });
            setHistory([]);
            setStats(null);
            historyActions.emitClearHistory(visitorToken || '');
        } catch (err) {
            setError('Failed to clear history');
        }
    }, [userId, visitorToken, setError, setHistory, setStats]);

    const trackSessionStart = useCallback((partnerId: string, mode: 'chat' | 'voice') => {
        if (!visitorToken) { console.warn('[HISTORY] Missing token for session start'); return; }
        historyActions.emitMatchEstablished(visitorToken, partnerId, mode);
    }, [visitorToken]);

    const trackSessionEnd = useCallback((reason?: SessionRecord['disconnectReason']) => {
        if (!visitorToken) { console.warn('[HISTORY] Missing token for session end'); return; }
        historyActions.emitSessionEnd(visitorToken, reason);
    }, [visitorToken]);

    return { fetchHistory, fetchStats, clearHistory, trackSessionStart, trackSessionEnd };
};
