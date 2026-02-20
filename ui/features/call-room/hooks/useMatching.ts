import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketEvent } from '../../../lib/socket';
import { SocketEvents } from '../../../lib/socket';
import {
    emitMatchReady,
    emitEndCall,
    emitRejoinCall,
    emitCancelReconnect,
} from '../../../lib/socket/matching/matching.actions';
import { matchmaking } from '@/lib/api';
import { useUser } from '@/hooks/useUser';
import {
    WaitingForMatchPayload,
    PrepareMatchPayload,
    MatchFoundPayload,
    MatchCancelledPayload,
    PartnerReconnectingPayload,
    PartnerReconnectedPayload,
    RejoinSuccessPayload,
    RejoinFailedPayload,
} from '../../../lib/socket/matching/matching.types';

export type MatchStatus = 'IDLE' | 'FINDING' | 'NEGOTIATING' | 'MATCHED' | 'RECONNECTING';

interface UseMatchingProps {
    onMatchFound?: (data: MatchFoundPayload) => void;
    onMatchCancelled?: (data: { reason: string }) => void;
    onCallEnded?: () => void;
    onPartnerReconnecting?: (data: PartnerReconnectingPayload) => void;
    onPartnerReconnected?: (data: PartnerReconnectedPayload) => void;
    onRejoinSuccess?: (data: RejoinSuccessPayload) => void;
    onRejoinFailed?: (data: { reason: string }) => void;
}

export const useMatching = ({
    onMatchFound,
    onMatchCancelled,
    onCallEnded,
    onPartnerReconnecting,
    onPartnerReconnected,
    onRejoinSuccess,
    onRejoinFailed,
}: UseMatchingProps) => {
    const { user } = useUser();
    const [status, setStatus] = useState<MatchStatus>('IDLE');
    const [position, setPosition] = useState<number | null>(null);
    const [reconnectCountdown, setReconnectCountdown] = useState<number | null>(null);

    // Stable callback refs
    const onMatchFoundRef = useRef(onMatchFound);
    const onMatchCancelledRef = useRef(onMatchCancelled);
    const onCallEndedRef = useRef(onCallEnded);
    const onPartnerReconnectingRef = useRef(onPartnerReconnecting);
    const onPartnerReconnectedRef = useRef(onPartnerReconnected);
    const onRejoinSuccessRef = useRef(onRejoinSuccess);
    const onRejoinFailedRef = useRef(onRejoinFailed);

    useEffect(() => {
        onMatchFoundRef.current = onMatchFound;
        onMatchCancelledRef.current = onMatchCancelled;
        onCallEndedRef.current = onCallEnded;
        onPartnerReconnectingRef.current = onPartnerReconnecting;
        onPartnerReconnectedRef.current = onPartnerReconnected;
        onRejoinSuccessRef.current = onRejoinSuccess;
        onRejoinFailedRef.current = onRejoinFailed;
    }, [onMatchFound, onMatchCancelled, onCallEnded, onPartnerReconnecting, onPartnerReconnected, onRejoinSuccess, onRejoinFailed]);

    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) { clearInterval(reconnectTimerRef.current); reconnectTimerRef.current = null; }
        setReconnectCountdown(null);
    }, []);

    // ── Event Handlers ────────────────────────────────────────────────────────

    const handleWaitingForMatch = useCallback((data: WaitingForMatchPayload) => {
        console.log(`[Matching] In queue, position: ${data.position}`);
        setStatus('FINDING');
        setPosition(data.position);
    }, []);

    const handlePrepareMatch = useCallback((_data: PrepareMatchPayload) => {
        console.log('[Matching] Match prepared, acknowledging...');
        setStatus('NEGOTIATING');
        emitMatchReady();
    }, []);

    const handleMatchCancelled = useCallback((data: { reason: string }) => {
        console.warn('[Matching] Match cancelled:', data.reason);
        setStatus('FINDING');
        setPosition(null);
        onMatchCancelledRef.current?.(data);
    }, []);

    const handleMatchFound = useCallback((data: MatchFoundPayload) => {
        clearReconnectTimer();
        setStatus('MATCHED');
        setPosition(null);
        onMatchFoundRef.current?.(data);
    }, [clearReconnectTimer]);

    const handleCallEnded = useCallback(() => {
        console.log('[Matching] Call ended. Resetting to IDLE.');
        clearReconnectTimer();
        setStatus('IDLE');
        setPosition(null);
        onCallEndedRef.current?.();
    }, [clearReconnectTimer]);

    const handlePartnerReconnecting = useCallback((data: PartnerReconnectingPayload) => {
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
        onPartnerReconnectingRef.current?.(data);
    }, [clearReconnectTimer]);

    const handlePartnerReconnected = useCallback((data: PartnerReconnectedPayload) => {
        console.log('[Matching] Partner reconnected!');
        clearReconnectTimer();
        setStatus('MATCHED');
        onPartnerReconnectedRef.current?.(data);
    }, [clearReconnectTimer]);

    const handleRejoinSuccess = useCallback((data: RejoinSuccessPayload) => {
        console.log('[Matching] Rejoin successful!', data);
        clearReconnectTimer();
        setStatus('MATCHED');
        onRejoinSuccessRef.current?.(data);
    }, [clearReconnectTimer]);

    const handleRejoinFailed = useCallback((data: { reason: string }) => {
        console.warn('[Matching] Rejoin failed:', data.reason);
        clearReconnectTimer();
        setStatus('IDLE');
        try { localStorage.removeItem('nz_active_call'); } catch { }
        onRejoinFailedRef.current?.(data);
    }, [clearReconnectTimer]);

    useSocketEvent<WaitingForMatchPayload>(SocketEvents.WAITING_FOR_MATCH, handleWaitingForMatch);
    useSocketEvent<PrepareMatchPayload>(SocketEvents.PREPARE_MATCH, handlePrepareMatch);
    useSocketEvent<{ reason: string }>(SocketEvents.MATCH_CANCELLED, handleMatchCancelled);
    useSocketEvent<MatchFoundPayload>(SocketEvents.MATCH_FOUND, handleMatchFound);
    useSocketEvent(SocketEvents.CALL_ENDED, handleCallEnded);
    useSocketEvent<PartnerReconnectingPayload>(SocketEvents.PARTNER_RECONNECTING, handlePartnerReconnecting);
    useSocketEvent<PartnerReconnectedPayload>(SocketEvents.PARTNER_RECONNECTED, handlePartnerReconnected);
    useSocketEvent<RejoinSuccessPayload>(SocketEvents.REJOIN_SUCCESS, handleRejoinSuccess);
    useSocketEvent<{ reason: string }>(SocketEvents.REJOIN_FAILED, handleRejoinFailed);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearReconnectTimer();
            setStatus('IDLE');
            setPosition(null);
        };
    }, [clearReconnectTimer]);

    // ── Actions ───────────────────────────────────────────────────────────────

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
                preferences: { region: options?.preferredCountry },
                session: { peerId: options?.peerId, connectionId: undefined },
                requestId,
            });
            if (error) { console.error('[Matching] Join queue failed:', error); setStatus('IDLE'); }
        } catch (err) {
            console.error('[Matching] Join queue exception:', err);
            setStatus('IDLE');
        }
    }, [user]);

    const stopSearch = useCallback(async () => {
        setStatus('IDLE');
        setPosition(null);
        try { await matchmaking.leaveQueue(); }
        catch (err) { console.error('[Matching] Leave queue exception:', err); }
    }, []);

    const endCall = useCallback((partnerId: string | null) => {
        setStatus('IDLE');
        emitEndCall(partnerId);
    }, []);

    const rejoinCall = useCallback((roomId?: string) => {
        console.log('[Matching] Attempting to rejoin call...');
        setStatus('RECONNECTING');
        emitRejoinCall(roomId);
    }, []);

    const cancelReconnect = useCallback(() => {
        console.log('[Matching] Cancelling reconnect...');
        clearReconnectTimer();
        setStatus('IDLE');
        emitCancelReconnect();
        try { localStorage.removeItem('nz_active_call'); } catch { }
    }, [clearReconnectTimer]);

    const [isSkipping, setIsSkipping] = useState(false);
    const skipTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => { if (skipTimerRef.current) clearTimeout(skipTimerRef.current); };
    }, []);

    const skipToNext = useCallback((preferredCountry?: string) => {
        if (isSkipping) return;
        console.log('[Matching] Skipping to next...');
        setIsSkipping(true);
        if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
        startSearch({ preferredCountry });
        skipTimerRef.current = setTimeout(() => { setIsSkipping(false); skipTimerRef.current = null; }, 2000);
    }, [isSkipping, startSearch]);

    useEffect(() => {
        if (status === 'MATCHED') setIsSkipping(false);
        else if (status === 'FINDING') {
            const timer = setTimeout(() => setIsSkipping(false), 500);
            return () => clearTimeout(timer);
        }
    }, [status]);

    return {
        startSearch,
        stopSearch,
        endCall,
        skipToNext,
        rejoinCall,
        cancelReconnect,
        status,
        position,
        isSkipping,
        reconnectCountdown,
    };
};
