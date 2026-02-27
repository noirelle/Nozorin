import { useEffect, useCallback, useRef } from 'react';
import { useReconnectState, ActiveCallData } from './useReconnectState';
import { useReconnectListeners } from './useReconnectListeners';
import { executeSessionVerification } from '../../../../hooks/session/useSessionActions';

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

    // Bootstrap from initial data if provided from AppPage (saves a network roundtrip)
    useEffect(() => {
        if (!hasCheckedRef.current && initialCallData) {
            console.log('[useReconnect] Bootstrapping from initial session data provided by parent');
            activeCallRef.current = initialCallData;
            onRestorePartnerRef.current?.(initialCallData);
            // We set hasChecked = true so handleIdentified knows it doesn't need to check API
            hasCheckedRef.current = true;
        }
    }, [initialCallData, hasCheckedRef, activeCallRef]);

    // We no longer rely on socket events. Instead, we pull session status when identified.
    const checkActiveSession = useCallback(async () => {
        if (hasCheckedRef.current || isCheckingRef.current) return;

        isCheckingRef.current = true;
        console.log('[useReconnect] Proactively checking for active session...');

        await executeSessionVerification({
            onStart: () => setIsReconnecting(true),
            onSuccess: (activeCall) => {
                activeCallRef.current = activeCall;
                onRestorePartnerRef.current?.(activeCall);
            },
            onError: (error) => {
                console.error('[useReconnect] Error pulling active call session:', error);
                setIsReconnecting(false);
            },
            onFinally: () => {
                isCheckingRef.current = false;
                hasCheckedRef.current = true;
            }
        });
    }, [setIsReconnecting, hasCheckedRef, activeCallRef]);

    const handleIdentified = useCallback(async () => {
        await checkActiveSession();
        // If we have an active call and haven't rejoined it yet, do it now
        if (activeCallRef.current && !rejoinEmittedRef.current) {
            rejoinEmittedRef.current = true;
            rejoinCall(activeCallRef.current.room_id);
        }
    }, [rejoinCall, checkActiveSession, rejoinEmittedRef, activeCallRef]);

    useEffect(() => {
        if (isReconnecting) reconnectStartRef.current = Date.now();
    }, [isReconnecting, reconnectStartRef]);

    const clearImmediately = useCallback(() => {
        if (minDisplayTimerRef.current) { clearTimeout(minDisplayTimerRef.current); minDisplayTimerRef.current = null; }
        setIsReconnecting(false);
    }, [minDisplayTimerRef, setIsReconnecting]);

    const clearWithMinDelay = useCallback(() => {
        const elapsed = Date.now() - reconnectStartRef.current;
        const remaining = Math.max(0, 3000 - elapsed);
        if (remaining === 0) setIsReconnecting(false);
        else minDisplayTimerRef.current = setTimeout(() => setIsReconnecting(false), remaining);
    }, [reconnectStartRef, minDisplayTimerRef, setIsReconnecting]);

    useReconnectListeners({
        handleIdentified,
        clearImmediately,
        clearWithMinDelay,
    });

    return { isReconnecting, clearReconnectState: clearImmediately };
};
