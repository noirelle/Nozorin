'use client';

import { useCallback } from 'react';
import * as historyActions from '../../lib/socket/history/history.actions';
import { SessionRecord } from '../../lib/socket/history/history.types';
import { UseHistoryStateReturn } from './useHistoryState';

interface UseHistoryActionsProps {
    visitorToken: string | null;
    setError: UseHistoryStateReturn['setError'];
    setIsLoading: UseHistoryStateReturn['setIsLoading'];
}

export const useHistoryActions = ({ visitorToken, setError, setIsLoading }: UseHistoryActionsProps) => {
    const fetchHistory = useCallback((limit: number = 20) => {
        if (!visitorToken) { setError('Token not available'); return; }
        setIsLoading(true);
        setError(null);
        historyActions.emitGetHistory(visitorToken, limit);
    }, [visitorToken, setError, setIsLoading]);

    const fetchStats = useCallback(() => {
        if (!visitorToken) { setError('Token not available'); return; }
        historyActions.emitGetHistoryStats(visitorToken);
    }, [visitorToken, setError]);

    const clearHistory = useCallback(() => {
        if (!visitorToken) { setError('Token not available'); return; }
        historyActions.emitClearHistory(visitorToken);
    }, [visitorToken, setError]);

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
