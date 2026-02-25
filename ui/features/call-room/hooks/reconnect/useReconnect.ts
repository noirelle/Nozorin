import { useEffect, useCallback, useRef } from 'react';
import { useReconnectState, ActiveCallData } from './useReconnectState';
import { useReconnectListeners } from './useReconnectListeners';

interface UseReconnectOptions {
    rejoinCall: (room_id?: string) => void;
    onRestorePartner?: (data: ActiveCallData) => void;
}

export const useReconnect = ({ rejoinCall, onRestorePartner }: UseReconnectOptions) => {
    const state = useReconnectState();
    const {
        isReconnecting,
        setIsReconnecting,
        attemptedRef,
        activeCallRef,
        reconnectStartRef,
        minDisplayTimerRef,
    } = state;

    const onRestorePartnerRef = useRef(onRestorePartner);
    useEffect(() => { onRestorePartnerRef.current = onRestorePartner; }, [onRestorePartner]);

    // Check localStorage for an active call once on mount
    useEffect(() => {
        if (attemptedRef.current) return;
        let stored: string | null = null;
        try { stored = localStorage.getItem('nz_active_call'); } catch { }
        if (!stored) return;

        let activeCall: ActiveCallData;
        try { activeCall = JSON.parse(stored); }
        catch { localStorage.removeItem('nz_active_call'); return; }

        const elapsed = Date.now() - activeCall.startedAt;
        if (elapsed > 120_000 || !activeCall.peerId) {
            localStorage.removeItem('nz_active_call');
            return;
        }

        setIsReconnecting(true);
        activeCallRef.current = activeCall;
        onRestorePartnerRef.current?.(activeCall);
    }, [attemptedRef, activeCallRef, setIsReconnecting]);

    const handleIdentified = useCallback(() => {
        if (attemptedRef.current || !activeCallRef.current) return;
        attemptedRef.current = true;
        rejoinCall(activeCallRef.current.room_id);
    }, [rejoinCall, attemptedRef, activeCallRef]);

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

    return { isReconnecting };
};
