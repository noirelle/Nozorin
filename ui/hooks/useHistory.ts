'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocketEvent } from '../lib/socket';
import { SocketEvents } from '../lib/socket';
import * as historyActions from '../lib/socket/history/history.actions';
import {
    HistoryDataPayload,
    HistoryStats,
    HistoryErrorPayload,
    PartnerStatusChangePayload,
    SessionRecord,
} from '../lib/socket/history/history.types';

export type { SessionRecord, HistoryStats };

export const useHistory = (visitorToken: string | null, onUnauthorized?: () => void) => {
    const [history, setHistory] = useState<SessionRecord[]>([]);
    const [stats, setStats] = useState<HistoryStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onUnauthorizedRef = useRef(onUnauthorized);
    useEffect(() => { onUnauthorizedRef.current = onUnauthorized; }, [onUnauthorized]);

    // ── Emitters ─────────────────────────────────────────────────────────────

    const fetchHistory = useCallback((limit: number = 20) => {
        if (!visitorToken) { setError('Token not available'); return; }
        setIsLoading(true);
        setError(null);
        historyActions.emitGetHistory(visitorToken, limit);
    }, [visitorToken]);

    const fetchStats = useCallback(() => {
        if (!visitorToken) { setError('Token not available'); return; }
        historyActions.emitGetHistoryStats(visitorToken);
    }, [visitorToken]);

    const clearHistory = useCallback(() => {
        if (!visitorToken) { setError('Token not available'); return; }
        historyActions.emitClearHistory(visitorToken);
    }, [visitorToken]);

    const trackSessionStart = useCallback((partnerId: string, mode: 'chat' | 'voice') => {
        if (!visitorToken) { console.warn('[HISTORY] Missing token for session start'); return; }
        historyActions.emitMatchEstablished(visitorToken, partnerId, mode);
        console.log('[HISTORY] Session start tracked');
    }, [visitorToken]);

    const trackSessionEnd = useCallback((reason?: SessionRecord['disconnectReason']) => {
        if (!visitorToken) { console.warn('[HISTORY] Missing token for session end'); return; }
        historyActions.emitSessionEnd(visitorToken, reason);
        console.log('[HISTORY] Session end tracked, reason:', reason || 'user-action');
    }, [visitorToken]);

    // ── Listeners ─────────────────────────────────────────────────────────────

    const handleHistoryData = useCallback((data: HistoryDataPayload) => {
        setHistory(data.history);
        setIsLoading(false);
        const partnerIds = [...new Set(data.history.map(s => s.partnerId).filter(id => id && id !== 'unknown'))];
        if (partnerIds.length > 0) historyActions.emitWatchUserStatus(partnerIds);
        console.log('[HISTORY] Received history:', data.history.length, 'sessions');
    }, []);

    const handlePartnerStatusChange = useCallback((data: PartnerStatusChangePayload) => {
        const { userId, status } = data;
        setHistory(prev => prev.map(session =>
            session.partnerId === userId ? { ...session, partnerStatus: status } : session
        ));
    }, []);

    const handleHistoryStats = useCallback((data: HistoryStats) => {
        setStats(data);
        console.log('[HISTORY] Received stats:', data);
    }, []);

    const handleHistoryCleared = useCallback(() => {
        setHistory([]);
        setStats(null);
        console.log('[HISTORY] History cleared');
    }, []);

    const handleHistoryError = useCallback((data: HistoryErrorPayload) => {
        const isUnauthorized = data.message === 'Invalid token';
        if (!isUnauthorized) { setError(data.message); setIsLoading(false); }
        console.error('[HISTORY] Error:', data.message);
        if (isUnauthorized) {
            console.warn('[HISTORY] Unauthorized, refreshing token...');
            onUnauthorizedRef.current?.();
        }
    }, []);

    useSocketEvent<HistoryDataPayload>(SocketEvents.HISTORY_DATA, handleHistoryData);
    useSocketEvent<PartnerStatusChangePayload>(SocketEvents.PARTNER_STATUS_CHANGE, handlePartnerStatusChange);
    useSocketEvent<HistoryStats>(SocketEvents.HISTORY_STATS, handleHistoryStats);
    useSocketEvent(SocketEvents.HISTORY_CLEARED, handleHistoryCleared);
    useSocketEvent<HistoryErrorPayload>(SocketEvents.HISTORY_ERROR, handleHistoryError);
    useSocketEvent<HistoryErrorPayload>(SocketEvents.HISTORY_STATS_ERROR, handleHistoryError);
    useSocketEvent<HistoryErrorPayload>(SocketEvents.HISTORY_CLEAR_ERROR, handleHistoryError);

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
