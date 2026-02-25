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

    const fetchHistory = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/session/history/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const result = await res.json();
            if (result.status === 'success') {
                setHistory(result.data.history);
                setStats(result.data.stats);

                // Watch for real-time status updates of partners
                const partnerIds = [...new Set(result.data.history.map((s: any) => s.partnerId).filter((id: string) => id && id !== 'unknown'))] as string[];
                if (partnerIds.length > 0) {
                    historyActions.emitWatchUserStatus(partnerIds);
                }
            } else {
                throw new Error(result.message || 'Failed to fetch history');
            }
        } catch (err) {
            setError('Failed to load history');
        } finally {
            setIsLoading(false);
        }
    }, [userId, setError, setIsLoading, setHistory, setStats]);

    const clearHistory = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/session/history/${userId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete history');
            const result = await res.json();
            if (result.status === 'success') {
                setHistory([]);
                setStats(null);
            } else {
                throw new Error(result.message || 'Failed to delete history');
            }
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

    return { fetchHistory, clearHistory, trackSessionStart, trackSessionEnd };
};
