import { useCallback, useEffect, useRef } from 'react';
import {
    emitMatchReady,
    emitEndCall,
    emitRejoinCall,
    emitCancelReconnect,
} from '../../../../lib/socket/matching/matching.actions';
import { matchmaking } from '@/lib/api';
import { useUser } from '@/hooks';
import {
    MatchFoundPayload,
    PartnerReconnectingPayload,
    PartnerReconnectedPayload,
    RejoinSuccessPayload,
} from '../../../../lib/socket/matching/matching.types';
import { UseMatchingStateReturn } from './useMatchingState';

interface MatchingCallbacks {
    onMatchFound?: (data: MatchFoundPayload) => void;
    onMatchCancelled?: (data: { reason: string }) => void;
    onCallEnded?: () => void;
    onPartnerReconnecting?: (data: PartnerReconnectingPayload) => void;
    onPartnerReconnected?: (data: PartnerReconnectedPayload) => void;
    onRejoinSuccess?: (data: RejoinSuccessPayload) => void;
    onRejoinFailed?: (data: { reason: string }) => void;
}

interface UseMatchingActionsProps extends UseMatchingStateReturn {
    callbacks: MatchingCallbacks;
}

export const useMatchingActions = ({
    status,
    isSkipping,
    clearReconnectTimer,
    setStatus,
    setPosition,
    setReconnectCountdown,
    setIsSkipping,
    reconnectTimerRef,
    skipTimerRef,
    callbacks,
}: UseMatchingActionsProps) => {
    const { user } = useUser();

    // Keep callbacks stable without stale closure issues
    const callbacksRef = useRef(callbacks);
    useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);

    const startSearch = useCallback(async (options?: {
        preferredCountry?: string;
        userId?: string;
        peerId?: string;
    }) => {
        const effectiveUserId = options?.userId || user?.id;
        if (!effectiveUserId) { console.error('[Matching] No user ID, cannot join queue'); return; }

        console.log(`[Matching] Starting search, preference: ${options?.preferredCountry || 'None'}`);
        setStatus('FINDING');

        try {
            const requestId = Math.random().toString(36).substring(7);
            const { error } = await matchmaking.joinQueue({
                userId: effectiveUserId,
                mode: 'voice' as const,
                preferences: { selectedCountry: options?.preferredCountry || 'GLOBAL' },
                session: { peerId: options?.peerId, connectionId: undefined },
                requestId,
            });
            if (error) { console.error('[Matching] Join queue failed:', error); setStatus('IDLE'); }
        } catch (err) {
            console.error('[Matching] Join queue exception:', err);
            setStatus('IDLE');
        }
    }, [user, setStatus]);

    const stopSearch = useCallback(async () => {
        setStatus('IDLE');
        setPosition(null);
        try { await matchmaking.leaveQueue(); }
        catch (err) { console.error('[Matching] Leave queue exception:', err); }
    }, [setStatus, setPosition]);

    const endCall = useCallback((partnerId: string | null) => {
        setStatus('IDLE');
        emitEndCall(partnerId);
    }, [setStatus]);

    const rejoinCall = useCallback((roomId?: string) => {
        console.log('[Matching] Attempting to rejoin call...');
        setStatus('RECONNECTING');
        emitRejoinCall(roomId);
    }, [setStatus]);

    const cancelReconnect = useCallback(() => {
        console.log('[Matching] Cancelling reconnect...');
        clearReconnectTimer();
        setStatus('IDLE');
        emitCancelReconnect();
        try { localStorage.removeItem('nz_active_call'); } catch { }
    }, [clearReconnectTimer, setStatus]);

    const skipToNext = useCallback((preferredCountry?: string) => {
        if (isSkipping) return;
        console.log('[Matching] Skipping to next...');
        setIsSkipping(true);
        if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
        startSearch({ preferredCountry });
        skipTimerRef.current = setTimeout(() => { setIsSkipping(false); skipTimerRef.current = null; }, 2000);
    }, [isSkipping, startSearch, setIsSkipping, skipTimerRef]);

    // Reset isSkipping when status changes
    useEffect(() => {
        if (status === 'MATCHED') setIsSkipping(false);
        else if (status === 'FINDING') {
            const timer = setTimeout(() => setIsSkipping(false), 500);
            return () => clearTimeout(timer);
        }
    }, [status, setIsSkipping]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearReconnectTimer();
            if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
            setStatus('IDLE');
            setPosition(null);
        };
    }, [clearReconnectTimer, setStatus, setPosition, skipTimerRef]);

    // ── Stable handler builders used by listeners ──────────────────────────────

    const buildHandleMatchFound = useCallback(() => (data: MatchFoundPayload) => {
        clearReconnectTimer();
        setStatus('MATCHED');
        setPosition(null);
        callbacksRef.current.onMatchFound?.(data);
    }, [clearReconnectTimer, setStatus, setPosition]);

    const buildHandleMatchCancelled = useCallback(() => (data: { reason: string }) => {
        console.warn('[Matching] Match cancelled:', data.reason);
        setStatus('FINDING');
        setPosition(null);
        callbacksRef.current.onMatchCancelled?.(data);
    }, [setStatus, setPosition]);

    const buildHandleCallEnded = useCallback(() => () => {
        console.log('[Matching] Call ended. Resetting to IDLE.');
        clearReconnectTimer();
        setStatus('IDLE');
        setPosition(null);
        callbacksRef.current.onCallEnded?.();
    }, [clearReconnectTimer, setStatus, setPosition]);

    const buildHandlePartnerReconnecting = useCallback(() => (data: PartnerReconnectingPayload) => {
        console.log(`[Matching] Partner reconnecting... timeout: ${data.timeoutMs}ms`);
        setStatus('RECONNECTING');
        const totalSeconds = Math.ceil(data.timeoutMs / 1000);
        setReconnectCountdown(totalSeconds);
        if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = setInterval(() => {
            setReconnectCountdown(prev => {
                if (prev === null || prev <= 1) { clearReconnectTimer(); return null; }
                return prev - 1;
            });
        }, 1000);
        callbacksRef.current.onPartnerReconnecting?.(data);
    }, [setStatus, setReconnectCountdown, reconnectTimerRef, clearReconnectTimer]);

    const buildHandlePartnerReconnected = useCallback(() => (data: PartnerReconnectedPayload) => {
        console.log('[Matching] Partner reconnected!');
        clearReconnectTimer();
        setStatus('MATCHED');
        callbacksRef.current.onPartnerReconnected?.(data);
    }, [clearReconnectTimer, setStatus]);

    const buildHandleRejoinSuccess = useCallback(() => (data: RejoinSuccessPayload) => {
        console.log('[Matching] Rejoin successful!', data);
        clearReconnectTimer();
        setStatus('MATCHED');
        callbacksRef.current.onRejoinSuccess?.(data);
    }, [clearReconnectTimer, setStatus]);

    const buildHandleRejoinFailed = useCallback(() => (data: { reason: string }) => {
        console.warn('[Matching] Rejoin failed:', data.reason);
        clearReconnectTimer();
        setStatus('IDLE');
        try { localStorage.removeItem('nz_active_call'); } catch { }
        callbacksRef.current.onRejoinFailed?.(data);
    }, [clearReconnectTimer, setStatus]);

    const buildHandleWaitingForMatch = useCallback(() => (data: { position: number }) => {
        console.log(`[Matching] In queue, position: ${data.position}`);
        setStatus('FINDING');
        setPosition(data.position);
    }, [setStatus, setPosition]);

    const buildHandlePrepareMatch = useCallback(() => () => {
        console.log('[Matching] Match prepared, acknowledging...');
        setStatus('NEGOTIATING');
        emitMatchReady();
    }, [setStatus]);

    return {
        startSearch,
        stopSearch,
        endCall,
        rejoinCall,
        cancelReconnect,
        skipToNext,
        // Handler builders for listeners
        buildHandleMatchFound,
        buildHandleMatchCancelled,
        buildHandleCallEnded,
        buildHandlePartnerReconnecting,
        buildHandlePartnerReconnected,
        buildHandleRejoinSuccess,
        buildHandleRejoinFailed,
        buildHandleWaitingForMatch,
        buildHandlePrepareMatch,
    };
};
