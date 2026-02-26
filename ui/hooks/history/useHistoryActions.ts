'use client';

import { useCallback } from 'react';
import { api } from '../../lib/api';
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
            const result = await api.get<any>(`/api/session/history/${userId}`);
            if (!result.error && result.data) {
                setHistory(result.data.history);
                setStats(result.data.stats);

                // Watch for real-time status updates of partners
                const partnerIds = [...new Set(result.data.history.map((s: any) => s.partner_id).filter((id: string) => id && id !== 'unknown'))] as string[];
                if (partnerIds.length > 0) {
                    historyActions.emitWatchUserStatus(partnerIds);
                }
            } else {
                throw new Error(result.error || 'Failed to fetch history');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load history');
        } finally {
            setIsLoading(false);
        }
    }, [userId, setError, setIsLoading, setHistory, setStats]);

    const clearHistory = useCallback(async () => {
        if (!userId) return;
        try {
            const result = await api.delete<any>(`/api/session/history/${userId}`);
            if (!result.error) {
                setHistory([]);
                setStats(null);
            } else {
                throw new Error(result.error || 'Failed to delete history');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to clear history');
        }
    }, [userId, setError, setHistory, setStats]);

    const trackSessionStart = useCallback((partnerId: string, mode: 'chat' | 'voice') => {
        if (!visitorToken) { console.warn('[HISTORY] Missing token for session start'); return; }
        historyActions.emitMatchEstablished(visitorToken, partnerId, mode);
    }, [visitorToken]);

    const trackSessionEnd = useCallback((reason?: SessionRecord['disconnect_reason']) => {
        if (!visitorToken) { console.warn('[HISTORY] Missing token for session end'); return; }
        historyActions.emitSessionEnd(visitorToken, reason);
    }, [visitorToken]);

    return { fetchHistory, clearHistory, trackSessionStart, trackSessionEnd };
};
