import { useCallback, useEffect, useRef } from 'react';
import {
    emitMatchReady,
    emitEndCall,
    emitRejoinCall,
    emitCancelReconnect,
} from '../../../../lib/socket/matching/matching.actions';
import { matchmaking } from '@/lib/api';
import { useUser } from '@/hooks';
import { waitForSocketConnection, getSocketClient } from '../../../../lib/socket/core/socketClient';
import { SocketEvents } from '../../../../lib/socket/core/socketEvents';
import { UseMatchingStateReturn } from './useMatchingState';
import {
    MatchFoundPayload,
    PartnerReconnectingPayload,
    PartnerReconnectedPayload,
    RejoinSuccessPayload,
} from '../../../../lib/socket/matching/matching.types';

interface MatchingCallbacks {
    onMatchFound?: (data: MatchFoundPayload) => void;
    onMatchCancelled?: (data: { reason: string }) => void;
    onCallEnded?: (data?: { reason?: string; by?: string }) => void;
    onPartnerReconnecting?: (data: PartnerReconnectingPayload) => void;
    onPartnerReconnected?: (data: PartnerReconnectedPayload) => void;
    onRejoinSuccess?: (data: RejoinSuccessPayload) => void;
    onRejoinFailed?: (data: { reason: string }) => void;
    onFatalError?: () => void;
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
    const { user, isChecking } = useUser();
    const isJoiningRef = useRef(false);
    const lastOptionsRef = useRef<{ preferred_country?: string; user_id?: string; peer_id?: string } | undefined>(undefined);

    // Keep callbacks and user/checking state stable for async loops
    const callbacksRef = useRef(callbacks);
    const userRef = useRef(user);
    const isCheckingRef = useRef(isChecking);

    useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { isCheckingRef.current = isChecking; }, [isChecking]);

    const waitForUser = useCallback(async (timeoutMs = 5000): Promise<boolean> => {
        if (!isCheckingRef.current && userRef.current?.id) return true;

        console.log('[Matching] Waiting for user identification...');
        return new Promise((resolve) => {
            const start = Date.now();
            const timer = setInterval(() => {
                if (!isCheckingRef.current) {
                    clearInterval(timer);
                    console.log('[Matching] User identification complete, user exists:', !!userRef.current?.id);
                    resolve(!!userRef.current?.id);
                } else if (Date.now() - start > timeoutMs) {
                    clearInterval(timer);
                    console.warn('[Matching] Timed out waiting for user identification');
                    resolve(false);
                }
            }, 100);
        });
    }, []);

    const startSearch = useCallback(async (options?: {
        preferred_country?: string;
        user_id?: string;
        peer_id?: string;
        isRetry?: boolean;
    }) => {
        if (isJoiningRef.current) {
            console.warn('[Matching] Join already in progress, ignoring request');
            return;
        }

        console.log(`[Matching] Starting search flow, preference: ${options?.preferred_country || 'None'}`);
        lastOptionsRef.current = options;
        setStatus('CONNECTING');
        isJoiningRef.current = true;

        try {
            // 0. Ensure user is identified (especially after quick reload)
            const userAvailable = await waitForUser();
            const effectiveUserId = options?.user_id || userRef.current?.id;

            if (!effectiveUserId) {
                console.error('[Matching] Aborting: No user ID available. userAvailable:', userAvailable);
                setStatus('IDLE');
                callbacksRef.current.onFatalError?.();
                return;
            }

            // 1. Ensure socket is connected and IDENTIFIED before joining the queue
            console.log('[Matching] Waiting for socket connection & identification...');
            const isConnected = await waitForSocketConnection();

            if (!isConnected) {
                console.error('[Matching] FAILED: Could not establish identified socket connection for join');
                setStatus('IDLE');
                callbacksRef.current.onFatalError?.();
                return;
            }

            console.log('[Matching] Socket ready. Transitioning to FINDING status...');
            setStatus('FINDING');
            console.log('[Matching] Calling joinQueue API...');

            // 2. Call the join queue API
            const requestId = Math.random().toString(36).substring(7);
            const joinPromise = matchmaking.joinQueue({
                user_id: effectiveUserId,
                mode: 'voice' as const,
                preferences: { selected_country: options?.preferred_country || 'GLOBAL' },
                session: { peer_id: options?.peer_id, connection_id: undefined },
                requestId, // Use camelCase requestId for backend compatibility
            } as any);

            // Add a safety timeout for the API call
            const timeoutPromise = new Promise<{ error: string; data: null }>(resolve =>
                setTimeout(() => resolve({ error: 'MATCHMAKING_TIMEOUT', data: null }), 10000)
            );

            const { error, data } = await Promise.race([joinPromise, timeoutPromise]);

            if (error) {
                console.error('[Matching] Join queue API failed:', error);

                // Check for transient "not connected" error and retry once
                const isNotConnectedError = typeof error === 'string' && error.includes('not connected');
                if (isNotConnectedError && !options?.isRetry) {
                    console.log('[Matching] Detected connection desync, attempting re-identification and retry...');

                    const s = getSocketClient();
                    const token = localStorage.getItem('nz_token');
                    if (s && token) {
                        s.emit(SocketEvents.USER_IDENTIFY, { token });
                    }

                    // Wait a bit and retry
                    await new Promise(r => setTimeout(r, 800));
                    isJoiningRef.current = false; // Allow the retry
                    return startSearch({ ...options, isRetry: true });
                }

                setStatus('IDLE');
                callbacksRef.current.onFatalError?.();
            } else {
                const alreadyQueued = (data as any)?.alreadyQueued;
                console.log(`[Matching] Join queue API success${alreadyQueued ? ' (already in queue)' : ''}`);
            }
        } catch (err) {
            console.error('[Matching] Join queue caught exception:', err);
            setStatus('IDLE');
            callbacksRef.current.onFatalError?.();
        } finally {
            isJoiningRef.current = false;
        }
    }, [setStatus, waitForUser]);

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

    const rejoinCall = useCallback((room_id?: string) => {
        console.log('[Matching] Attempting to rejoin call...');
        setStatus('RECONNECTING');
        emitRejoinCall(room_id);
    }, [setStatus]);

    const cancelReconnect = useCallback(() => {
        console.log('[Matching] Cancelling reconnect...');
        clearReconnectTimer();
        setStatus('IDLE');
        emitCancelReconnect();
        try { localStorage.removeItem('nz_active_call'); } catch { }
    }, [clearReconnectTimer, setStatus]);

    const skipToNext = useCallback((preferred_country?: string) => {
        if (isSkipping) return;
        console.log('[Matching] Skipping to next...');
        setIsSkipping(true);
        if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
        startSearch({ preferred_country });
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

    const buildHandleCallEnded = useCallback(() => (data?: { reason?: string; by?: string }) => {
        console.log('[Matching] Call ended. Resetting to IDLE. Reason:', data?.reason || data?.by || 'unknown');
        clearReconnectTimer();
        setStatus('IDLE');
        setPosition(null);
        callbacksRef.current.onCallEnded?.(data);
    }, [clearReconnectTimer, setStatus, setPosition]);

    const buildHandlePartnerReconnecting = useCallback(() => (data: PartnerReconnectingPayload) => {
        console.log(`[Matching] Partner reconnecting... timeout: ${data.timeout_ms}ms`);
        setStatus('RECONNECTING');
        const totalSeconds = Math.ceil(data.timeout_ms / 1000);
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
