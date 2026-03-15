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
            return;
        }

        isCheckingRef.current = true;
        rejoinStartTimeRef.current = performance.now();

        await executeSessionVerification({
            onStart: () => { },
            onSuccess: (activeCall) => {
                setIsReconnecting(true);
                activeCallRef.current = activeCall;
                onRestorePartnerRef.current?.(activeCall);
            },
            onError: (_error) => {
                setIsReconnecting(false);
            },
            onFinally: () => {
                isCheckingRef.current = false;
                hasCheckedRef.current = true;
                // If we didn't find an active call, clear the reconnecting state
                if (!activeCallRef.current) {
                    setIsReconnecting(false);
                }
            }
        });
    }, [setIsReconnecting, hasCheckedRef, activeCallRef]);

    const rejoinRetryRef = useRef(0);
    const rejoinRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleIdentified = useCallback(async () => {
        await checkActiveSession();
        // If we have an active call, tell the server we're back and wait for partner
        if (activeCallRef.current && !rejoinEmittedRef.current) {
            rejoinEmittedRef.current = true;
            rejoinRetryRef.current = 0;
            rejoinCall(activeCallRef.current.room_id);
        }
    }, [rejoinCall, checkActiveSession, rejoinEmittedRef, activeCallRef]);

    // Bootstrap from initial data if provided from AppPage (saves a network roundtrip)
    useEffect(() => {
        if (!hasCheckedRef.current && initialCallData) {
            activeCallRef.current = initialCallData;
            onRestorePartnerRef.current?.(initialCallData);
            // We set hasChecked = true so handleIdentified knows it doesn't need to check API
            hasCheckedRef.current = true;

            waitForSocketConnection(10000).then((ready: boolean) => {
                if (ready) {
                    handleIdentified();
                } else {
                }
            });
        }
    }, [initialCallData, hasCheckedRef, activeCallRef, onRestorePartnerRef, handleIdentified]);

    // Handle rejoin failures — rely on server's proactive REJOIN_SUCCESS instead of polling.
    // We only add a single 15-second failsafe timeout here.
    const handleRejoinFailed = useCallback((data: { reason: string }) => {
        const elapsed = Math.round(performance.now() - rejoinStartTimeRef.current);
        if (data.reason === 'partner-not-ready') {
            if (!rejoinRetryTimerRef.current) {
                // Single 15-second failsafe timeout. If the server doesn't proactively send
                // REJOIN_SUCCESS (via waitingForPartner resolution) by then, we give up.
                rejoinRetryTimerRef.current = setTimeout(() => {
                    setIsReconnecting(false);
                    rejoinRetryRef.current = 0;
                }, 15000);
            }
        } else {
            // Permanent failure — clear reconnecting state
            setIsReconnecting(false);
            rejoinRetryRef.current = 0;
        }
    }, [setIsReconnecting]);

    // Handle partner coming back online (server proactively notifies us)
    // The server has ALREADY set up activeCalls for both sides at this point.
    // The matching layer (useMatchingActions) handles the WebRTC re-establishment.
    // We just need to clear the reconnecting UI state.
    const handlePartnerReconnected = useCallback((_data: { new_socket_id: string; new_user_id: string }) => {
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
        rejoinStartTimeRef.current = 0;
        if (minDisplayTimerRef.current) { clearTimeout(minDisplayTimerRef.current); minDisplayTimerRef.current = null; }
        if (rejoinRetryTimerRef.current) { clearTimeout(rejoinRetryTimerRef.current); rejoinRetryTimerRef.current = null; }
        rejoinRetryRef.current = 0;
        setIsReconnecting(false);
    }, [minDisplayTimerRef, setIsReconnecting]);


    useReconnectListeners({
        handleIdentified,
        clearImmediately,
        handleRejoinFailed,
        handlePartnerReconnected,
    });

    return { isReconnecting, clearReconnectState: clearImmediately };
};
