import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocketEvent, SocketEvents } from '../../../lib/socket';

interface ActiveCallData {
    roomId?: string;
    peerId: string;
    startedAt: number;
    partnerProfile?: {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
        country: string;
    };
}

export const useReconnectState = () => {
    const [isReconnecting, setIsReconnecting] = useState(false);
    const attemptedRef = useRef(false);
    const activeCallRef = useRef<ActiveCallData | null>(null);
    const reconnectStartRef = useRef<number>(0);
    const minDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);
        };
    }, []);

    return {
        isReconnecting,
        setIsReconnecting,
        attemptedRef,
        activeCallRef,
        reconnectStartRef,
        minDisplayTimerRef,
    };
};

interface UseReconnectOptions {
    rejoinCall: (roomId?: string) => void;
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

    // Emit rejoin once socket is identified
    const handleIdentified = useCallback(() => {
        if (attemptedRef.current || !activeCallRef.current) return;
        attemptedRef.current = true;
        rejoinCall(activeCallRef.current.roomId);
    }, [rejoinCall, attemptedRef, activeCallRef]);

    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentified);

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

    useSocketEvent(SocketEvents.REJOIN_SUCCESS, clearImmediately);
    useSocketEvent(SocketEvents.REJOIN_FAILED, clearWithMinDelay);
    useSocketEvent(SocketEvents.CALL_ENDED, clearWithMinDelay);

    return { isReconnecting };
};
