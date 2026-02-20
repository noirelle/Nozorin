import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocketEvent } from '../../../lib/socket';
import { SocketEvents } from '../../../lib/socket';

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

interface UseReconnectOptions {
    rejoinCall: (roomId?: string) => void;
    onRestorePartner?: (data: ActiveCallData) => void;
}

export const useReconnect = ({ rejoinCall, onRestorePartner }: UseReconnectOptions) => {
    const [isReconnecting, setIsReconnecting] = useState(false);
    const attemptedRef = useRef(false);
    const onRestorePartnerRef = useRef(onRestorePartner);
    const activeCallRef = useRef<ActiveCallData | null>(null);

    useEffect(() => { onRestorePartnerRef.current = onRestorePartner; }, [onRestorePartner]);

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

        console.log('[Reconnect] Active call found, trying to reconnect.');
        setIsReconnecting(true);
        activeCallRef.current = activeCall;
        onRestorePartnerRef.current?.(activeCall);
    }, []);

    const handleIdentified = useCallback(() => {
        if (attemptedRef.current || !activeCallRef.current) return;
        attemptedRef.current = true;
        console.log('[Reconnect] Socket identified — emitting rejoin-call.');
        rejoinCall(activeCallRef.current.roomId);
    }, [rejoinCall]);

    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentified);

    const reconnectStartRef = useRef<number>(0);
    const minDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isReconnecting) reconnectStartRef.current = Date.now();
    }, [isReconnecting]);

    const clearImmediately = useCallback(() => {
        if (minDisplayTimerRef.current) { clearTimeout(minDisplayTimerRef.current); minDisplayTimerRef.current = null; }
        setIsReconnecting(false);
    }, []);

    const clearWithMinDelay = useCallback(() => {
        const elapsed = Date.now() - reconnectStartRef.current;
        const remaining = Math.max(0, 3000 - elapsed);
        if (remaining === 0) setIsReconnecting(false);
        else minDisplayTimerRef.current = setTimeout(() => setIsReconnecting(false), remaining);
    }, []);

    useSocketEvent(SocketEvents.REJOIN_SUCCESS, clearImmediately);
    useSocketEvent(SocketEvents.REJOIN_FAILED, clearWithMinDelay);
    useSocketEvent(SocketEvents.CALL_ENDED, clearWithMinDelay);

    useEffect(() => {
        return () => { if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current); };
    }, []);

    return { isReconnecting };
};
