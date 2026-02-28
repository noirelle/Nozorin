import { useEffect, useCallback, useRef } from 'react';
import { useReconnectState, ActiveCallData } from './useReconnectState';
import { useReconnectListeners } from './useReconnectListeners';
import { executeSessionVerification } from '../../../../hooks/session/useSessionActions';
import { isSocketIdentified, waitForSocketConnection } from '../../../../lib/socket/core/socketClient';

interface UseReconnectOptions {
    rejoinCall: (room_id?: string) => void;
    onRestorePartner?: (data: ActiveCallData) => void;
    initialReconnecting?: boolean;
    initialCallData?: any;
}

export const useReconnect = ({
    rejoinCall,
    onRestorePartner,
    initialReconnecting = false,
    initialCallData = null
}: UseReconnectOptions) => {
    const state = useReconnectState(initialReconnecting);
    const {
        isReconnecting,
        setIsReconnecting,
        hasCheckedRef,
        rejoinEmittedRef,
        activeCallRef,
        reconnectStartRef,
        minDisplayTimerRef,
    } = state;

    const onRestorePartnerRef = useRef(onRestorePartner);
    useEffect(() => { onRestorePartnerRef.current = onRestorePartner; }, [onRestorePartner]);

    const isCheckingRef = useRef(false);
    const rejoinStartTimeRef = useRef<number>(0);

    // We no longer rely on socket events. Instead, we pull session status when identified.
    const checkActiveSession = useCallback(async () => {
        if (hasCheckedRef.current || isCheckingRef.current) {
            console.log(`[useReconnect] checkActiveSession skipped — hasChecked=${hasCheckedRef.current}, isChecking=${isCheckingRef.current}`);
            return;
        }

        isCheckingRef.current = true;
        rejoinStartTimeRef.current = performance.now();
        console.log('[useReconnect] Checking for active session...');

        await executeSessionVerification({
            onStart: () => setIsReconnecting(true),
            onSuccess: (activeCall) => {
                const elapsed = Math.round(performance.now() - rejoinStartTimeRef.current);
                console.log(`[useReconnect] ✓ Active room found: ${activeCall?.room_id || 'unknown'} (${elapsed}ms) — waiting for partner to join`);
                activeCallRef.current = activeCall;
                onRestorePartnerRef.current?.(activeCall);
            },
            onError: (error) => {
                console.error('[useReconnect] ✗ Session check failed:', error);
                setIsReconnecting(false);
            },
            onFinally: () => {
                isCheckingRef.current = false;
                hasCheckedRef.current = true;
            }
        });
    }, [setIsReconnecting, hasCheckedRef, activeCallRef]);

    const rejoinRetryRef = useRef(0);
    const rejoinRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleIdentified = useCallback(async () => {
        console.log('[useReconnect] handleIdentified called');
        await checkActiveSession();
        // If we have an active call, tell the server we're back and wait for partner
        if (activeCallRef.current && !rejoinEmittedRef.current) {
            console.log(`Trying to join ${activeCallRef.current.room_id}`);
            rejoinEmittedRef.current = true;
            rejoinRetryRef.current = 0;
            rejoinCall(activeCallRef.current.room_id);
        }
    }, [rejoinCall, checkActiveSession, rejoinEmittedRef, activeCallRef]);

    // Bootstrap from initial data if provided from AppPage (saves a network roundtrip)
    useEffect(() => {
        if (!hasCheckedRef.current && initialCallData) {
            console.log('[useReconnect] Bootstrapping from initial session data provided by parent');
            activeCallRef.current = initialCallData;
            onRestorePartnerRef.current?.(initialCallData);
            // We set hasChecked = true so handleIdentified knows it doesn't need to check API
            hasCheckedRef.current = true;

            waitForSocketConnection(10000).then((ready: boolean) => {
                if (ready) {
                    console.log('[useReconnect] Socket ready after bootstrap, triggering manual join');
                    handleIdentified();
                } else {
                    console.error('[useReconnect] Socket failed to connect/identify after bootstrap');
                }
            });
        }
    }, [initialCallData, hasCheckedRef, activeCallRef, onRestorePartnerRef, handleIdentified]);

    // Handle rejoin failures — retry for 'partner-not-ready'
    const handleRejoinFailed = useCallback((data: { reason: string }) => {
        const elapsed = Math.round(performance.now() - rejoinStartTimeRef.current);
        if (data.reason === 'partner-not-ready' && rejoinRetryRef.current < 10) {
            rejoinRetryRef.current += 1;
            console.log(`[useReconnect] Partner not ready (${elapsed}ms elapsed), retry ${rejoinRetryRef.current}/10 in 2s...`);
            rejoinRetryTimerRef.current = setTimeout(() => {
                if (activeCallRef.current) {
                    rejoinCall(activeCallRef.current.room_id);
                }
            }, 2000);
        } else {
            // Permanent failure — clear reconnecting state
            console.error(`[useReconnect] Reconnection failed after ${elapsed}ms — reason: ${data.reason}`);
            setIsReconnecting(false);
            rejoinRetryRef.current = 0;
        }
    }, [rejoinCall, activeCallRef, setIsReconnecting]);

    // Handle partner coming back online (server proactively notifies us)
    // The server has ALREADY set up activeCalls for both sides at this point.
    // The matching layer (useMatchingActions) handles the WebRTC re-establishment.
    // We just need to clear the reconnecting UI state.
    const handlePartnerReconnected = useCallback((_data: { new_socket_id: string; new_user_id: string }) => {
        const elapsed = Math.round(performance.now() - rejoinStartTimeRef.current);
        console.log(`[useReconnect] Partner reconnected — reconnection completed in ${elapsed}ms`);
        if (rejoinRetryTimerRef.current) { clearTimeout(rejoinRetryTimerRef.current); rejoinRetryTimerRef.current = null; }
        rejoinRetryRef.current = 0;
        setIsReconnecting(false);
    }, [setIsReconnecting]);

    useEffect(() => {
        if (isReconnecting) reconnectStartRef.current = Date.now();
    }, [isReconnecting, reconnectStartRef]);

    // Cleanup retry timer on unmount
    useEffect(() => {
        return () => {
            if (rejoinRetryTimerRef.current) clearTimeout(rejoinRetryTimerRef.current);
        };
    }, []);

    const clearImmediately = useCallback(() => {
        const elapsed = Math.round(performance.now() - rejoinStartTimeRef.current);
        if (rejoinStartTimeRef.current > 0) {
            console.log(`[useReconnect] Reconnection successful in ${elapsed}ms`);
            rejoinStartTimeRef.current = 0;
        }
        if (minDisplayTimerRef.current) { clearTimeout(minDisplayTimerRef.current); minDisplayTimerRef.current = null; }
        if (rejoinRetryTimerRef.current) { clearTimeout(rejoinRetryTimerRef.current); rejoinRetryTimerRef.current = null; }
        rejoinRetryRef.current = 0;
        setIsReconnecting(false);
    }, [minDisplayTimerRef, setIsReconnecting]);

    const clearWithMinDelay = useCallback(() => {
        rejoinRetryRef.current = 0;
        if (rejoinRetryTimerRef.current) { clearTimeout(rejoinRetryTimerRef.current); rejoinRetryTimerRef.current = null; }
        const elapsed = Date.now() - reconnectStartRef.current;
        const remaining = Math.max(0, 3000 - elapsed);
        if (remaining === 0) setIsReconnecting(false);
        else minDisplayTimerRef.current = setTimeout(() => setIsReconnecting(false), remaining);
    }, [reconnectStartRef, minDisplayTimerRef, setIsReconnecting]);

    useReconnectListeners({
        handleIdentified,
        clearImmediately,
        clearWithMinDelay,
        handleRejoinFailed,
        handlePartnerReconnected,
    });

    return { isReconnecting, clearReconnectState: clearImmediately };
};
