'use client';

import { useCallback } from 'react';
import { useSocketEvent, SocketEvents } from '../../lib/socket';
import * as historyActions from '../../lib/socket/history/history.actions';
import {
    HistoryDataPayload,
    HistoryStats,
    HistoryErrorPayload,
    PartnerStatusChangePayload,
} from '../../lib/socket/history/history.types';
import { UseHistoryStateReturn } from './useHistoryState';

interface UseHistoryListenersProps {
    setHistory: UseHistoryStateReturn['setHistory'];
    setStats: UseHistoryStateReturn['setStats'];
    setIsLoading: UseHistoryStateReturn['setIsLoading'];
    setError: UseHistoryStateReturn['setError'];
    onUnauthorizedRef: UseHistoryStateReturn['onUnauthorizedRef'];
}

export const useHistoryListeners = ({
    setHistory,
    setStats,
    setIsLoading,
    setError,
    onUnauthorizedRef,
}: UseHistoryListenersProps) => {
    const handleHistoryData = useCallback((data: HistoryDataPayload) => {
        setHistory(data.history);
        setIsLoading(false);
        const partnerIds = [...new Set(data.history.map(s => s.partnerId).filter(id => id && id !== 'unknown'))];
        if (partnerIds.length > 0) historyActions.emitWatchUserStatus(partnerIds);
    }, [setHistory, setIsLoading]);

    const handlePartnerStatusChange = useCallback((data: PartnerStatusChangePayload) => {
        setHistory(prev => prev.map(session =>
            session.partnerId === data.userId ? { ...session, partnerStatus: data.status } : session
        ));
    }, [setHistory]);

    const handleHistoryStats = useCallback((data: HistoryStats) => {
        setStats(data);
    }, [setStats]);

    const handleHistoryCleared = useCallback(() => {
        setHistory([]);
        setStats(null);
    }, [setHistory, setStats]);

    const handleHistoryError = useCallback((data: HistoryErrorPayload) => {
        const isUnauthorized = data.message === 'Invalid token';
        if (!isUnauthorized) { setError(data.message); setIsLoading(false); }
        console.error('[HISTORY] Error:', data.message);
        if (isUnauthorized) onUnauthorizedRef.current?.();
    }, [setError, setIsLoading, onUnauthorizedRef]);

    useSocketEvent<HistoryDataPayload>(SocketEvents.HISTORY_DATA, handleHistoryData);
    useSocketEvent<PartnerStatusChangePayload>(SocketEvents.PARTNER_STATUS_CHANGE, handlePartnerStatusChange);
    useSocketEvent<HistoryStats>(SocketEvents.HISTORY_STATS, handleHistoryStats);
    useSocketEvent(SocketEvents.HISTORY_CLEARED, handleHistoryCleared);
    useSocketEvent<HistoryErrorPayload>(SocketEvents.HISTORY_ERROR, handleHistoryError);
    useSocketEvent<HistoryErrorPayload>(SocketEvents.HISTORY_STATS_ERROR, handleHistoryError);
    useSocketEvent<HistoryErrorPayload>(SocketEvents.HISTORY_CLEAR_ERROR, handleHistoryError);
};
